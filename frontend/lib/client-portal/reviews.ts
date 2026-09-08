import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import ReviewDraft from "@/models/ReviewDraft";
import ReviewAllocation from "@/models/ReviewAllocation";
import PostedReview from "@/models/PostedReview";
import ClientEvent from "@/models/ClientEvent";
import { resolveActorByName } from "@/lib/client-portal/actors";
import {
  CLIENT_REVIEW_STATUS_LABEL,
  paginate,
  type ClientReviewDetail,
  type ClientReviewListItem,
  type ClientReviewStatus,
  type ClientReviewTimelineEvent,
  type Paginated,
} from "@/lib/client-portal/dto";

/**
 * The client's view of the review pipeline.
 *
 * A "review" row is either a customer-specific allocation (draft → team
 * member → customer) or a draft that has not been allocated yet. Cancelled
 * allocations and archived drafts are not shown. All lookups start from the
 * client's drafts, so nothing outside `clientId` can be reached.
 */

export type ReviewRow = ClientReviewListItem & {
  draftId: string;
  /** Row creation moment used for "new in period" counts and the trend. */
  createdAtDate: Date;
  assignedAt: Date | null;
  sharedAt: Date | null;
  postedAt: Date | null;
  /** For draft rows: when the draft was first allocated (it stops being a draft). */
  allocatedAt: Date | null;
  /** Latest lifecycle moment, used for default sorting and date filters. */
  activityAt: Date;
};

type DraftLean = {
  _id: mongoose.Types.ObjectId;
  subject?: string;
  reviewText?: string;
  category?: string;
  language?: string;
  suggestedRating?: string;
  status?: string;
  createdBy?: string;
  createdAt?: Date;
};

type AllocationLean = {
  _id: mongoose.Types.ObjectId;
  draftId: mongoose.Types.ObjectId;
  customerName?: string;
  platform?: string;
  sentDate?: Date;
  allocationStatus?: string;
  postedDate?: Date;
  assignedDate?: Date;
  createdAt?: Date;
};

type PostedLean = {
  _id: mongoose.Types.ObjectId;
  allocationId: mongoose.Types.ObjectId;
  draftId: mongoose.Types.ObjectId;
  platform?: string;
  reviewLink?: string;
  proofUrl?: string;
  postedDate?: Date;
  postedByName?: string;
};

const DRAFT_FIELDS =
  "_id subject reviewText category language suggestedRating status createdBy createdAt";
const ALLOCATION_FIELDS =
  "_id draftId customerName platform sentDate allocationStatus postedDate assignedDate createdAt";
const POSTED_FIELDS =
  "_id allocationId draftId platform reviewLink proofUrl postedDate postedByName";

export function parseRating(raw: unknown): number | null {
  const n = Number.parseFloat(String(raw ?? "").trim());
  if (!Number.isFinite(n)) return null;
  const r = Math.round(n);
  return r >= 1 && r <= 5 ? r : null;
}

export function normalizePlatform(raw: unknown): string | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  const lower = s.toLowerCase();
  if (lower === "justdail") return "Justdial";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function allocationToStatus(status: string | undefined): ClientReviewStatus | null {
  switch (status) {
    case "Posted":
    case "Used":
      return "POSTED";
    case "Shared with Customer":
      return "SHARED";
    case "Assigned":
    case "Unassigned":
      return "IN_PROGRESS";
    default:
      return null; // Cancelled or unknown
  }
}

function iso(d: Date | null | undefined): string | null {
  return d ? new Date(d).toISOString() : null;
}

function maxDate(...dates: (Date | null | undefined)[]): Date {
  let best: Date | null = null;
  for (const d of dates) {
    if (d && (!best || d.getTime() > best.getTime())) best = d;
  }
  return best ?? new Date(0);
}

async function loadRaw(clientId: string) {
  await dbConnect();
  const cid = new mongoose.Types.ObjectId(clientId);
  const drafts = (await ReviewDraft.find({ clientId: cid })
    .select(DRAFT_FIELDS)
    .lean()) as unknown as DraftLean[];
  const draftIds = drafts.map((d) => d._id);
  if (draftIds.length === 0) {
    return { drafts, allocations: [] as AllocationLean[], posted: [] as PostedLean[] };
  }
  const [allocations, posted] = await Promise.all([
    ReviewAllocation.find({ draftId: { $in: draftIds } })
      .select(ALLOCATION_FIELDS)
      .lean() as unknown as Promise<AllocationLean[]>,
    PostedReview.find({ draftId: { $in: draftIds } })
      .select(POSTED_FIELDS)
      .sort({ postedDate: -1 })
      .lean() as unknown as Promise<PostedLean[]>,
  ]);
  return { drafts, allocations, posted };
}

function buildRows(raw: Awaited<ReturnType<typeof loadRaw>>): ReviewRow[] {
  const draftById = new Map(raw.drafts.map((d) => [String(d._id), d]));
  const postedByAllocation = new Map<string, PostedLean>();
  for (const p of raw.posted) {
    const key = String(p.allocationId);
    if (!postedByAllocation.has(key)) postedByAllocation.set(key, p);
  }
  const firstAllocationByDraft = new Map<string, Date>();
  const rows: ReviewRow[] = [];

  for (const a of raw.allocations) {
    const draft = draftById.get(String(a.draftId));
    if (!draft) continue;
    const assignedAt = a.assignedDate ?? a.createdAt ?? null;
    if (assignedAt) {
      const key = String(a.draftId);
      const prev = firstAllocationByDraft.get(key);
      if (!prev || assignedAt.getTime() < prev.getTime()) {
        firstAllocationByDraft.set(key, assignedAt);
      }
    }
    const status = allocationToStatus(a.allocationStatus);
    if (!status) continue;
    const posted = postedByAllocation.get(String(a._id));
    const postedAt =
      status === "POSTED" ? (posted?.postedDate ?? a.postedDate ?? null) : null;
    const sharedAt = a.sentDate ?? null;
    const createdAtDate = assignedAt ?? a.createdAt ?? new Date(0);
    rows.push({
      id: String(a._id),
      kind: "allocation",
      draftId: String(a.draftId),
      subject: String(draft.subject ?? ""),
      customerName: a.customerName?.trim() || posted?.postedByName?.trim() || null,
      platform: normalizePlatform(posted?.platform || a.platform),
      rating: parseRating(draft.suggestedRating),
      status,
      createdAt: createdAtDate.toISOString(),
      assignedDate: iso(assignedAt),
      sharedDate: iso(sharedAt),
      postedDate: iso(postedAt),
      reviewLink: posted?.reviewLink?.trim() || null,
      createdAtDate,
      assignedAt,
      sharedAt,
      postedAt,
      allocatedAt: null,
      activityAt: maxDate(createdAtDate, assignedAt, sharedAt, postedAt),
    });
  }

  for (const d of raw.drafts) {
    if (d.status === "Archived") continue;
    const key = String(d._id);
    const allocatedAt = firstAllocationByDraft.get(key) ?? null;
    const hasLiveAllocation = raw.allocations.some(
      (a) => String(a.draftId) === key && allocationToStatus(a.allocationStatus),
    );
    if (hasLiveAllocation) continue;
    const createdAtDate = d.createdAt ?? new Date(0);
    rows.push({
      id: key,
      kind: "draft",
      draftId: key,
      subject: String(d.subject ?? ""),
      customerName: null,
      platform: null,
      rating: parseRating(d.suggestedRating),
      status: "DRAFT",
      createdAt: createdAtDate.toISOString(),
      assignedDate: null,
      sharedDate: null,
      postedDate: null,
      reviewLink: null,
      createdAtDate,
      assignedAt: null,
      sharedAt: null,
      postedAt: null,
      allocatedAt,
      activityAt: createdAtDate,
    });
  }

  rows.sort((a, b) => b.activityAt.getTime() - a.activityAt.getTime());
  return rows;
}

/** Everything needed by the dashboard, list and analytics, in one pass. */
export async function loadClientReviewRows(clientId: string): Promise<{
  rows: ReviewRow[];
  /** Non-archived drafts with the moment they were first allocated (for trends). */
  draftLifecycles: { createdAt: Date; allocatedAt: Date | null }[];
}> {
  const raw = await loadRaw(clientId);
  const rows = buildRows(raw);
  const firstAllocation = new Map<string, Date>();
  for (const a of raw.allocations) {
    const at = a.assignedDate ?? a.createdAt;
    if (!at) continue;
    const key = String(a.draftId);
    const prev = firstAllocation.get(key);
    if (!prev || at.getTime() < prev.getTime()) firstAllocation.set(key, at);
  }
  const draftLifecycles = raw.drafts
    .filter((d) => d.status !== "Archived" && d.createdAt)
    .map((d) => ({
      createdAt: d.createdAt as Date,
      allocatedAt: firstAllocation.get(String(d._id)) ?? null,
    }));
  return { rows, draftLifecycles };
}

export function toListItem(row: ReviewRow): ClientReviewListItem {
  return {
    id: row.id,
    kind: row.kind,
    subject: row.subject,
    customerName: row.customerName,
    platform: row.platform,
    rating: row.rating,
    status: row.status,
    createdAt: row.createdAt,
    assignedDate: row.assignedDate,
    sharedDate: row.sharedDate,
    postedDate: row.postedDate,
    reviewLink: row.reviewLink,
  };
}

export type ClientReviewListQuery = {
  status?: ClientReviewStatus | null;
  platform?: string | null;
  search?: string | null;
  from?: Date | null;
  to?: Date | null;
  page: number;
  pageSize: number;
};

export type ClientReviewListResult = Paginated<ClientReviewListItem> & {
  counts: Record<ClientReviewStatus | "ALL", number>;
  platforms: string[];
};

export async function listClientReviews(
  clientId: string,
  q: ClientReviewListQuery,
): Promise<ClientReviewListResult> {
  const { rows } = await loadClientReviewRows(clientId);

  const counts: Record<ClientReviewStatus | "ALL", number> = {
    ALL: rows.length,
    POSTED: 0,
    SHARED: 0,
    IN_PROGRESS: 0,
    DRAFT: 0,
  };
  const platformSet = new Set<string>();
  for (const r of rows) {
    counts[r.status] += 1;
    if (r.platform) platformSet.add(r.platform);
  }

  const search = (q.search ?? "").trim().toLowerCase();
  const platform = (q.platform ?? "").trim().toLowerCase();
  const filtered = rows.filter((r) => {
    if (q.status && r.status !== q.status) return false;
    if (platform && (r.platform ?? "").toLowerCase() !== platform) return false;
    if (q.from && r.activityAt.getTime() < q.from.getTime()) return false;
    if (q.to && r.activityAt.getTime() > q.to.getTime()) return false;
    if (search) {
      const hay = `${r.subject} ${r.customerName ?? ""} ${r.platform ?? ""} ${CLIENT_REVIEW_STATUS_LABEL[r.status]}`.toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });

  const start = (q.page - 1) * q.pageSize;
  const items = filtered.slice(start, start + q.pageSize).map(toListItem);
  return {
    ...paginate(items, q.page, q.pageSize, filtered.length),
    counts,
    platforms: Array.from(platformSet).sort(),
  };
}

// ─── Detail ──────────────────────────────────────────────────────────────────

type EventLean = {
  _id: mongoose.Types.ObjectId;
  action: string;
  title: string;
  description: string;
  actorName?: string;
  actorRole: ClientReviewTimelineEvent["actorRole"];
  occurredAt: Date;
};

const STEP_ACTIONS: Record<string, ClientReviewTimelineEvent["step"]> = {
  DRAFT_CREATED: "CREATED",
  DRAFT_ALLOCATED: "ASSIGNED",
  REVIEW_ASSIGNED: "ASSIGNED",
  REVIEW_SHARED: "SHARED",
  REVIEW_POSTED: "POSTED",
  REVIEW_CONFIRMED_POSTED: "POSTED",
};

/**
 * Load one review for the client. `id` may be an allocation id or a draft id;
 * both are verified to belong to `clientId` (otherwise null → 404).
 */
export async function getClientReviewDetail(
  clientId: string,
  id: string,
): Promise<ClientReviewDetail | null> {
  if (!mongoose.isValidObjectId(id)) return null;
  await dbConnect();
  const cid = new mongoose.Types.ObjectId(clientId);
  const oid = new mongoose.Types.ObjectId(id);

  let allocation: AllocationLean | null = null;
  let draft: DraftLean | null = null;

  allocation = (await ReviewAllocation.findById(oid)
    .select(ALLOCATION_FIELDS)
    .lean()) as unknown as AllocationLean | null;
  if (allocation) {
    draft = (await ReviewDraft.findOne({ _id: allocation.draftId, clientId: cid })
      .select(DRAFT_FIELDS)
      .lean()) as unknown as DraftLean | null;
    if (!draft) return null; // allocation belongs to another client
    if (!allocationToStatus(allocation.allocationStatus)) return null;
  } else {
    draft = (await ReviewDraft.findOne({ _id: oid, clientId: cid })
      .select(DRAFT_FIELDS)
      .lean()) as unknown as DraftLean | null;
    if (!draft || draft.status === "Archived") return null;
  }

  const posted = allocation
    ? ((await PostedReview.findOne({ allocationId: allocation._id })
        .select(POSTED_FIELDS)
        .sort({ postedDate: -1 })
        .lean()) as unknown as PostedLean | null)
    : null;

  const status: ClientReviewStatus = allocation
    ? (allocationToStatus(allocation.allocationStatus) ?? "IN_PROGRESS")
    : "DRAFT";
  const assignedAt = allocation ? (allocation.assignedDate ?? allocation.createdAt ?? null) : null;
  const sharedAt = allocation?.sentDate ?? null;
  const postedAt =
    status === "POSTED" ? (posted?.postedDate ?? allocation?.postedDate ?? null) : null;

  const relatedIds = [draft._id, ...(allocation ? [allocation._id] : [])];
  const events = (await ClientEvent.find({
    clientId: cid,
    visibility: "CLIENT_VISIBLE",
    relatedReviewId: { $in: relatedIds },
  })
    .select("_id action title description actorName actorRole occurredAt")
    .sort({ occurredAt: 1 })
    .lean()) as unknown as EventLean[];

  const creator = await resolveActorByName(draft.createdBy);
  const timeline: ClientReviewTimelineEvent[] = [];
  const stepEvent = (step: ClientReviewTimelineEvent["step"]) =>
    events.find((e) => STEP_ACTIONS[e.action] === step);

  const pushStep = (
    step: ClientReviewTimelineEvent["step"],
    title: string,
    fallbackDescription: string,
    at: Date | null,
    fallbackActor?: { actorName: string; actorRole: ClientReviewTimelineEvent["actorRole"] },
  ) => {
    const ev = stepEvent(step);
    if (!at && !ev) return;
    timeline.push({
      id: ev ? String(ev._id) : `${step}-${at?.getTime()}`,
      step,
      title,
      description: ev?.description ?? fallbackDescription,
      actorName: ev?.actorName ?? fallbackActor?.actorName ?? null,
      actorRole: ev?.actorRole ?? fallbackActor?.actorRole ?? null,
      occurredAt: (at ?? ev?.occurredAt ?? new Date()).toISOString(),
    });
  };

  pushStep("CREATED", "Draft created", "The review draft was prepared.", draft.createdAt ?? null, {
    actorName: creator.actorName,
    actorRole: creator.actorRole,
  });
  pushStep("ASSIGNED", "Assigned", "Assigned to a team member for outreach.", assignedAt);
  pushStep(
    "SHARED",
    "Shared with customer",
    allocation?.customerName ? `Shared with ${allocation.customerName}.` : "Shared with the customer.",
    sharedAt,
  );
  pushStep(
    "POSTED",
    "Posted",
    posted?.platform ? `Posted on ${posted.platform}.` : "The review went live.",
    postedAt,
  );

  const stepIds = new Set(timeline.map((t) => t.id));
  for (const e of events) {
    if (STEP_ACTIONS[e.action] && stepIds.has(String(e._id))) continue;
    if (STEP_ACTIONS[e.action]) continue; // duplicate step event (e.g. re-share)
    timeline.push({
      id: String(e._id),
      step: "ACTIVITY",
      title: e.title,
      description: e.description,
      actorName: e.actorName ?? null,
      actorRole: e.actorRole,
      occurredAt: new Date(e.occurredAt).toISOString(),
    });
  }
  timeline.sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));

  const createdAtDate = assignedAt ?? draft.createdAt ?? new Date(0);
  return {
    id: allocation ? String(allocation._id) : String(draft._id),
    kind: allocation ? "allocation" : "draft",
    subject: String(draft.subject ?? ""),
    customerName: allocation?.customerName?.trim() || posted?.postedByName?.trim() || null,
    platform: normalizePlatform(posted?.platform || allocation?.platform),
    rating: parseRating(draft.suggestedRating),
    status,
    createdAt: createdAtDate.toISOString(),
    assignedDate: iso(assignedAt),
    sharedDate: iso(sharedAt),
    postedDate: iso(postedAt),
    reviewLink: posted?.reviewLink?.trim() || null,
    reviewText: String(draft.reviewText ?? ""),
    category: draft.category ?? null,
    language: draft.language ?? null,
    proofUrl: posted?.proofUrl?.trim() || null,
    postedByName: posted?.postedByName?.trim() || null,
    timeline,
  };
}
