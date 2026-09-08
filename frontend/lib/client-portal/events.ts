import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import ClientEvent, {
  type ClientEventActorRole,
  type ClientEventCategory,
  type ClientEventEntityType,
  type ClientEventSource,
  type ClientEventVisibility,
} from "@/models/ClientEvent";
import ReviewDraft from "@/models/ReviewDraft";
import ReviewAllocation from "@/models/ReviewAllocation";
import PostedReview from "@/models/PostedReview";
import Client from "@/models/Client";
import { isUnassignedClientLike } from "@/lib/reviews/unassigned-client";
import { resolveActorByName } from "@/lib/client-portal/actors";
import { notifyClientUsers } from "@/lib/client-portal/notifications";
import type { NotificationType } from "@/models/Notification";

/**
 * Client-visible event feed.
 *
 * `recordClientEvent` is the single write path. `mapReviewActivityToClientEvents`
 * turns one ReviewActivityLog row into zero or more client events (with a
 * visibility decision), and is used both by the live hook in
 * lib/review-activity.ts and by the idempotent history backfill.
 */

export type ClientEventInput = {
  clientId: string;
  entityType: ClientEventEntityType;
  entityId?: string | null;
  action: string;
  title: string;
  description: string;
  actorUserId?: string | null;
  actorName?: string;
  actorRole: ClientEventActorRole;
  visibility: ClientEventVisibility;
  category: ClientEventCategory;
  source: ClientEventSource;
  sourceLogId?: string | null;
  relatedReviewId?: string | null;
  relatedLabel?: string;
  metadata?: Record<string, unknown>;
  occurredAt?: Date;
  /** Optional client notification to fan out when the event is client-visible. */
  notify?: { type: NotificationType; title: string; message: string; href?: string };
  /** After recording, check whether a posted-review milestone was reached. */
  checkMilestone?: boolean;
};

const MILESTONE_STEP = 10;

function oid(v: string | null | undefined): mongoose.Types.ObjectId | null {
  return v && mongoose.isValidObjectId(v) ? new mongoose.Types.ObjectId(v) : null;
}

export async function recordClientEvent(
  input: ClientEventInput,
): Promise<string | null> {
  try {
    if (!mongoose.isValidObjectId(input.clientId)) return null;
    await dbConnect();
    const doc = await ClientEvent.create({
      clientId: new mongoose.Types.ObjectId(input.clientId),
      entityType: input.entityType,
      entityId: oid(input.entityId),
      action: input.action,
      title: input.title,
      description: input.description,
      actorUserId: input.actorUserId ?? null,
      actorName: input.actorName,
      actorRole: input.actorRole,
      visibility: input.visibility,
      category: input.category,
      source: input.source,
      sourceLogId: oid(input.sourceLogId),
      relatedReviewId: oid(input.relatedReviewId),
      relatedLabel: input.relatedLabel,
      metadata: input.metadata,
      occurredAt: input.occurredAt ?? new Date(),
    });

    if (input.visibility === "CLIENT_VISIBLE" && input.notify) {
      await notifyClientUsers({ clientId: input.clientId, ...input.notify });
    }
    if (input.visibility === "CLIENT_VISIBLE" && input.checkMilestone) {
      await maybeRecordPostedMilestone(input.clientId, input.occurredAt);
    }
    return String(doc._id);
  } catch (error) {
    // Duplicate sourceLogId (already mapped) is expected during backfills.
    const code = (error as { code?: number })?.code;
    if (code !== 11000) console.error("Failed to record client event:", error);
    return null;
  }
}

async function maybeRecordPostedMilestone(clientId: string, at?: Date) {
  const cid = new mongoose.Types.ObjectId(clientId);
  const draftIds = await ReviewDraft.find({ clientId: cid }).distinct("_id");
  if (draftIds.length === 0) return;
  const posted = await PostedReview.countDocuments({ draftId: { $in: draftIds } });
  if (posted === 0 || posted % MILESTONE_STEP !== 0) return;

  const already = await ClientEvent.exists({
    clientId: cid,
    action: "MILESTONE",
    "metadata.posted": posted,
  });
  if (already) return;

  await recordClientEvent({
    clientId,
    entityType: "SYSTEM",
    action: "MILESTONE",
    title: `${posted} reviews posted`,
    description: `Your account has reached ${posted} posted reviews.`,
    actorName: "System",
    actorRole: "SYSTEM",
    visibility: "CLIENT_VISIBLE",
    category: "REVIEW",
    source: "SYSTEM",
    metadata: { posted },
    occurredAt: at ?? new Date(),
    notify: {
      type: "REVIEW_MILESTONE",
      title: `Milestone: ${posted} reviews posted`,
      message: `Your account has reached ${posted} posted reviews.`,
      href: "/client/review-analytics",
    },
  });
}

// ─── Mapping review activity → client events ─────────────────────────────────

export type ReviewActivityLike = {
  _id?: unknown;
  entityType: "DRAFT" | "ALLOCATION" | "POSTED_REVIEW";
  entityId: unknown;
  action: string;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  performedBy: string;
  performedAt?: Date | string;
};

type Ctx = {
  clientId: string | null;
  /** Client the draft belonged to before a REASSIGN_CLIENT. */
  previousClientId?: string | null;
  draftId: string | null;
  allocationId: string | null;
  subject: string;
  customerName: string;
  platform: string;
  postedByName: string;
};

const INTERNAL_KEYS = new Set([
  "_id",
  "__v",
  "id",
  "notes",
  "remarks",
  "agencyId",
  "assignedPartnerAgencyId",
  "assigneeType",
  "assigneeTeamMemberId",
  "assigneePartnerAgencyId",
  "assignedToUserId",
  "assignedToUserName",
  "assignedByUserId",
  "assignedByUserName",
  "createdBy",
  "createdAt",
  "updatedAt",
  "markedUsedBy",
  "customerContact",
]);

function str(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (v instanceof Date) return v.toISOString();
  return "";
}

function refId(v: unknown): string | null {
  if (!v) return null;
  if (typeof v === "string") return mongoose.isValidObjectId(v) ? v : null;
  if (typeof v === "object") {
    const o = v as { _id?: unknown; toString?: () => string };
    if (o._id != null) return refId(o._id);
    if (v instanceof mongoose.Types.ObjectId) return v.toString();
    const s = o.toString?.();
    return s && mongoose.isValidObjectId(s) ? s : null;
  }
  return null;
}

function refField(v: unknown, field: string): string {
  if (v && typeof v === "object" && field in (v as object)) {
    return str((v as Record<string, unknown>)[field]);
  }
  return "";
}

function changedKeys(
  oldValue?: Record<string, unknown> | null,
  newValue?: Record<string, unknown> | null,
): string[] {
  if (!oldValue || !newValue) return [];
  const keys = new Set([...Object.keys(oldValue), ...Object.keys(newValue)]);
  const out: string[] = [];
  for (const k of keys) {
    if (INTERNAL_KEYS.has(k)) continue;
    const a = JSON.stringify(oldValue[k] ?? null);
    const b = JSON.stringify(newValue[k] ?? null);
    if (a !== b) out.push(k);
  }
  return out;
}

function quote(subject: string) {
  return subject ? `“${subject}”` : "a review";
}

function allocationStatusLabel(status: string): string {
  switch (status) {
    case "Shared with Customer":
      return "Shared with you";
    case "Posted":
    case "Used":
      return "Posted";
    case "Assigned":
    case "Unassigned":
      return "In progress";
    case "Cancelled":
      return "Cancelled";
    default:
      return status || "updated";
  }
}

function draftStatusLabel(status: string): string {
  switch (status) {
    case "Available":
      return "Draft";
    case "Allocated":
      return "In progress";
    case "Shared":
      return "Shared with you";
    case "Used":
      return "Posted";
    case "Archived":
      return "Archived";
    default:
      return status || "updated";
  }
}

async function loadContext(log: ReviewActivityLike): Promise<Ctx> {
  const ctx: Ctx = {
    clientId: null,
    draftId: null,
    allocationId: null,
    subject: "",
    customerName: "",
    platform: "",
    postedByName: "",
  };
  const entityId = refId(log.entityId);
  const nv = log.newValue ?? {};
  const ov = log.oldValue ?? {};

  if (log.entityType === "DRAFT") {
    ctx.draftId = entityId;
    ctx.subject = str(nv.subject) || str(ov.subject);
    ctx.clientId = refId(nv.clientId) ?? null;
    if (log.action === "REASSIGN_CLIENT") {
      ctx.previousClientId = refId(ov.clientId);
    }
    if (entityId && (!ctx.clientId || !ctx.subject)) {
      const draft = await ReviewDraft.findById(entityId)
        .select("clientId subject")
        .lean();
      if (draft) {
        ctx.clientId = ctx.clientId ?? refId(draft.clientId);
        ctx.subject = ctx.subject || str(draft.subject);
      }
    }
    return ctx;
  }

  if (log.entityType === "ALLOCATION") {
    ctx.allocationId = entityId;
    ctx.draftId = refId(nv.draftId) ?? refId(ov.draftId);
    ctx.subject = refField(nv.draftId, "subject") || refField(ov.draftId, "subject");
    ctx.customerName = str(nv.customerName) || str(ov.customerName);
    ctx.platform = str(nv.platform) || str(ov.platform);
    if (entityId && (!ctx.draftId || !ctx.customerName || !ctx.platform)) {
      const alloc = await ReviewAllocation.findById(entityId)
        .select("draftId customerName platform")
        .lean();
      if (alloc) {
        ctx.draftId = ctx.draftId ?? refId(alloc.draftId);
        ctx.customerName = ctx.customerName || str(alloc.customerName);
        ctx.platform = ctx.platform || str(alloc.platform);
      }
    }
  } else {
    // POSTED_REVIEW
    ctx.draftId = refId(nv.draftId) ?? refId(ov.draftId);
    ctx.allocationId = refId(nv.allocationId) ?? refId(ov.allocationId);
    ctx.platform = str(nv.platform) || str(ov.platform);
    ctx.postedByName = str(nv.postedByName) || str(ov.postedByName);
    if (entityId && (!ctx.draftId || !ctx.allocationId || !ctx.platform)) {
      const posted = await PostedReview.findById(entityId)
        .select("draftId allocationId platform postedByName")
        .lean();
      if (posted) {
        ctx.draftId = ctx.draftId ?? refId(posted.draftId);
        ctx.allocationId = ctx.allocationId ?? refId(posted.allocationId);
        ctx.platform = ctx.platform || str(posted.platform);
        ctx.postedByName = ctx.postedByName || str(posted.postedByName);
      }
    }
  }

  if (ctx.draftId) {
    const draft = await ReviewDraft.findById(ctx.draftId)
      .select("clientId subject")
      .lean();
    if (draft) {
      ctx.clientId = refId(draft.clientId);
      ctx.subject = ctx.subject || str(draft.subject);
    }
  }
  return ctx;
}

const unassignedCache = new Map<string, boolean>();
async function isUnassignedClient(clientId: string): Promise<boolean> {
  const hit = unassignedCache.get(clientId);
  if (hit !== undefined) return hit;
  const client = await Client.findById(clientId)
    .select("email businessName name")
    .lean();
  const result = !client || isUnassignedClientLike(client);
  unassignedCache.set(clientId, result);
  return result;
}

type Mapped = Omit<
  ClientEventInput,
  "clientId" | "actorRole" | "actorName" | "actorUserId" | "source" | "sourceLogId" | "occurredAt"
>;

function mapDraft(log: ReviewActivityLike, ctx: Ctx): Mapped[] {
  const base = {
    entityType: "REVIEW_DRAFT" as const,
    entityId: ctx.draftId,
    relatedReviewId: ctx.draftId,
    relatedLabel: ctx.subject || undefined,
  };
  const s = quote(ctx.subject);
  switch (log.action) {
    case "CREATE":
      return [
        {
          ...base,
          action: "DRAFT_CREATED",
          title: "New review draft prepared",
          description: `Draft ${s} was added to your review bank.`,
          visibility: "CLIENT_VISIBLE",
          category: "REVIEW",
        },
      ];
    case "UPDATE": {
      const changed = changedKeys(log.oldValue, log.newValue);
      const content = changed.filter((k) =>
        ["subject", "reviewText", "category", "language", "suggestedRating", "tone"].includes(k),
      );
      if (changed.includes("status")) {
        return [
          {
            ...base,
            action: "DRAFT_STATUS_CHANGED",
            title: "Review status changed",
            description: `Draft ${s} is now ${draftStatusLabel(str(log.newValue?.status))}.`,
            visibility: "CLIENT_VISIBLE",
            category: "REVIEW",
            metadata: { changed },
          },
        ];
      }
      if (content.length > 0) {
        return [
          {
            ...base,
            action: "DRAFT_UPDATED",
            title: "Review draft updated",
            description: `Draft ${s} was revised.`,
            visibility: "CLIENT_VISIBLE",
            category: "REVIEW",
            metadata: { changed: content },
          },
        ];
      }
      return [
        {
          ...base,
          action: "DRAFT_UPDATED_INTERNAL",
          title: "Review draft updated (internal fields)",
          description: `Internal details of draft ${s} were changed.`,
          visibility: "INTERNAL",
          category: "DATA",
          metadata: { changed },
        },
      ];
    }
    case "ALLOCATE":
      return [
        {
          ...base,
          action: "DRAFT_ALLOCATED",
          title: "Review assigned to the team",
          description: `Draft ${s} was assigned for customer outreach.`,
          visibility: "CLIENT_VISIBLE",
          category: "REVIEW",
        },
      ];
    case "ARCHIVE":
      return [
        {
          ...base,
          action: "DRAFT_ARCHIVED",
          title: "Review draft archived",
          description: `Draft ${s} was archived and is no longer in use.`,
          visibility: "CLIENT_VISIBLE",
          category: "DATA",
        },
      ];
    case "RECYCLE":
      return [
        {
          ...base,
          action: "DRAFT_RECYCLED",
          title: "Review draft recycled",
          description: `Draft ${s} was made available for reuse.`,
          visibility: "CLIENT_VISIBLE",
          category: "DATA",
        },
      ];
    case "DUPLICATE":
      return [
        {
          ...base,
          action: "DRAFT_DUPLICATED",
          title: "Review draft duplicated",
          description: `Draft ${s} was duplicated by the team.`,
          visibility: "INTERNAL",
          category: "DATA",
        },
      ];
    case "REASSIGN_CLIENT":
      return [
        {
          ...base,
          action: "DRAFT_ADDED",
          title: "Review draft added to your account",
          description: `Draft ${s} was moved into your review bank.`,
          visibility: "CLIENT_VISIBLE",
          category: "DATA",
        },
      ];
    default:
      return [
        {
          ...base,
          action: `DRAFT_${log.action}`,
          title: `Review draft ${log.action.toLowerCase().replace(/_/g, " ")}`,
          description: `Draft ${s}.`,
          visibility: "INTERNAL",
          category: "DATA",
        },
      ];
  }
}

function mapAllocation(log: ReviewActivityLike, ctx: Ctx): Mapped[] {
  const base = {
    entityType: "REVIEW_ALLOCATION" as const,
    entityId: ctx.allocationId,
    relatedReviewId: ctx.allocationId,
    relatedLabel: ctx.customerName || ctx.subject || undefined,
  };
  const s = quote(ctx.subject);
  const forCustomer = ctx.customerName ? ` for ${ctx.customerName}` : "";
  const onPlatform = ctx.platform ? ` on ${ctx.platform}` : "";
  switch (log.action) {
    case "CREATE":
      return [
        {
          ...base,
          action: "REVIEW_ASSIGNED",
          title: "Review assigned",
          description: `${s} was assigned to a team member${forCustomer}.`,
          visibility: "CLIENT_VISIBLE",
          category: "REVIEW",
        },
      ];
    case "REASSIGN":
      return [
        {
          ...base,
          action: "REVIEW_REASSIGNED",
          title: "Review reassigned",
          description: `${s} was handed to another team member${forCustomer}.`,
          visibility: "CLIENT_VISIBLE",
          category: "REVIEW",
        },
      ];
    case "MARK_SHARED":
      return [
        {
          ...base,
          action: "REVIEW_SHARED",
          title: "Review shared with customer",
          description: `${s} was shared with ${ctx.customerName || "the customer"}${onPlatform}.`,
          visibility: "CLIENT_VISIBLE",
          category: "REVIEW",
          notify: {
            type: "REVIEW_SHARED",
            title: "Review shared with a customer",
            message: `${ctx.subject || "A review"} was shared with ${ctx.customerName || "a customer"}${onPlatform}.`,
            href: ctx.allocationId ? `/client/reviews/${ctx.allocationId}` : "/client/reviews",
          },
        },
      ];
    case "MARK_POSTED":
      // The POSTED_REVIEW CREATE row logged in the same request carries the
      // platform and link; this row would duplicate it.
      return [
        {
          ...base,
          action: "REVIEW_POSTED_STATUS",
          title: "Review marked as posted",
          description: `${s} was marked as posted${onPlatform}.`,
          visibility: "INTERNAL",
          category: "REVIEW",
        },
      ];
    case "MARK_USED":
      return [
        {
          ...base,
          action: "REVIEW_CONFIRMED_POSTED",
          title: "Review confirmed as posted",
          description: `${s} was confirmed as posted${onPlatform}.`,
          visibility: "CLIENT_VISIBLE",
          category: "REVIEW",
          notify: {
            type: "REVIEW_POSTED",
            title: "Review confirmed as posted",
            message: `${ctx.subject || "A review"} was confirmed as posted${onPlatform}.`,
            href: ctx.allocationId ? `/client/reviews/${ctx.allocationId}` : "/client/reviews",
          },
          checkMilestone: true,
        },
      ];
    case "UPDATE": {
      const changed = changedKeys(log.oldValue, log.newValue);
      if (changed.includes("allocationStatus")) {
        const next = str(log.newValue?.allocationStatus);
        return [
          {
            ...base,
            action: "REVIEW_STATUS_CHANGED",
            title: "Review status changed",
            description: `${s}${forCustomer} is now ${allocationStatusLabel(next)}.`,
            visibility: next === "Cancelled" ? "INTERNAL" : "CLIENT_VISIBLE",
            category: "REVIEW",
            metadata: { changed },
          },
        ];
      }
      if (changed.some((k) => ["customerName", "platform"].includes(k))) {
        return [
          {
            ...base,
            action: "CUSTOMER_DETAILS_UPDATED",
            title: "Customer details updated",
            description: `Customer or platform details for ${s} were updated.`,
            visibility: "CLIENT_VISIBLE",
            category: "DATA",
            metadata: { changed },
          },
        ];
      }
      if (changed.some((k) => ["sentDate", "postedDate", "usedDate"].includes(k))) {
        return [
          {
            ...base,
            action: "REVIEW_DATES_UPDATED",
            title: "Review dates corrected",
            description: `Dates for ${s} were corrected by the team.`,
            visibility: "CLIENT_VISIBLE",
            category: "DATA",
            metadata: { changed },
          },
        ];
      }
      return [
        {
          ...base,
          action: "ALLOCATION_UPDATED_INTERNAL",
          title: "Review assignment updated (internal fields)",
          description: `Internal details for ${s} were changed.`,
          visibility: "INTERNAL",
          category: "DATA",
          metadata: { changed },
        },
      ];
    }
    default:
      return [
        {
          ...base,
          action: `ALLOCATION_${log.action}`,
          title: `Review assignment ${log.action.toLowerCase().replace(/_/g, " ")}`,
          description: `${s}${forCustomer}.`,
          visibility: "INTERNAL",
          category: "DATA",
        },
      ];
  }
}

function mapPostedReview(log: ReviewActivityLike, ctx: Ctx): Mapped[] {
  const base = {
    entityType: "POSTED_REVIEW" as const,
    entityId: refId(log.entityId),
    relatedReviewId: ctx.allocationId,
    relatedLabel: ctx.postedByName || ctx.subject || undefined,
  };
  const platform = ctx.platform || "the review platform";
  switch (log.action) {
    case "CREATE":
      return [
        {
          ...base,
          action: "REVIEW_POSTED",
          title: `Review posted on ${platform}`,
          description: `${ctx.postedByName ? `${ctx.postedByName}'s review` : quote(ctx.subject)} went live on ${platform}.`,
          visibility: "CLIENT_VISIBLE",
          category: "REVIEW",
          notify: {
            type: "REVIEW_POSTED",
            title: `Review posted on ${platform}`,
            message: `${ctx.postedByName ? `${ctx.postedByName}'s review` : ctx.subject || "A review"} is now live on ${platform}.`,
            href: ctx.allocationId ? `/client/reviews/${ctx.allocationId}` : "/client/reviews",
          },
          checkMilestone: true,
        },
      ];
    case "UPDATE": {
      const changed = changedKeys(log.oldValue, log.newValue);
      if (changed.includes("proofUrl")) {
        return [
          {
            ...base,
            action: "REVIEW_PROOF_UPLOADED",
            title: "Review proof uploaded",
            description: `A screenshot was attached to the review posted on ${platform}.`,
            visibility: "CLIENT_VISIBLE",
            category: "REVIEW",
          },
        ];
      }
      if (changed.includes("reviewLink")) {
        return [
          {
            ...base,
            action: "REVIEW_LINK_ADDED",
            title: "Review link added",
            description: `A link to the review on ${platform} was added.`,
            visibility: "CLIENT_VISIBLE",
            category: "REVIEW",
          },
        ];
      }
      return [
        {
          ...base,
          action: "POSTED_REVIEW_UPDATED_INTERNAL",
          title: "Posted review updated (internal fields)",
          description: `Internal details of a posted review were changed.`,
          visibility: "INTERNAL",
          category: "DATA",
          metadata: { changed },
        },
      ];
    }
    case "MARK_USED":
      return [
        {
          ...base,
          action: "POSTED_REVIEW_MARK_USED",
          title: "Posted review marked as used",
          description: `The posted review on ${platform} was marked as used.`,
          visibility: "INTERNAL",
          category: "DATA",
        },
      ];
    default:
      return [
        {
          ...base,
          action: `POSTED_REVIEW_${log.action}`,
          title: `Posted review ${log.action.toLowerCase().replace(/_/g, " ")}`,
          description: `Posted review on ${platform}.`,
          visibility: "INTERNAL",
          category: "DATA",
        },
      ];
  }
}

/**
 * Build the client events for one review activity row. Returns an empty list
 * when the row cannot be tied to a real client (e.g. the "Unassigned" pseudo
 * client).
 */
export async function mapReviewActivityToClientEvents(
  log: ReviewActivityLike,
): Promise<ClientEventInput[]> {
  await dbConnect();
  const ctx = await loadContext(log);
  const actor = await resolveActorByName(log.performedBy);
  const occurredAt = log.performedAt ? new Date(log.performedAt) : new Date();
  const sourceLogId = refId(log._id);

  const mapped =
    log.entityType === "DRAFT"
      ? mapDraft(log, ctx)
      : log.entityType === "ALLOCATION"
        ? mapAllocation(log, ctx)
        : mapPostedReview(log, ctx);

  const out: ClientEventInput[] = [];
  const targets: { clientId: string; items: Mapped[] }[] = [];
  if (ctx.clientId) targets.push({ clientId: ctx.clientId, items: mapped });
  if (
    log.entityType === "DRAFT" &&
    log.action === "REASSIGN_CLIENT" &&
    ctx.previousClientId &&
    ctx.previousClientId !== ctx.clientId
  ) {
    targets.push({
      clientId: ctx.previousClientId,
      items: [
        {
          entityType: "REVIEW_DRAFT",
          entityId: ctx.draftId,
          relatedReviewId: null,
          relatedLabel: ctx.subject || undefined,
          action: "DRAFT_REMOVED",
          title: "Review draft moved out of your account",
          description: `Draft ${quote(ctx.subject)} is no longer part of your review bank.`,
          visibility: "CLIENT_VISIBLE",
          category: "DATA",
        },
      ],
    });
  }

  for (const target of targets) {
    if (await isUnassignedClient(target.clientId)) continue;
    for (const item of target.items) {
      out.push({
        ...item,
        clientId: target.clientId,
        actorName: actor.actorName,
        actorRole: actor.actorRole,
        actorUserId: actor.actorUserId,
        source: "REVIEW_ACTIVITY",
        sourceLogId,
        occurredAt,
      });
    }
  }
  return out;
}

/** Map + persist. Safe to call twice for the same log row (unique index). */
export async function recordClientEventsFromReviewActivity(
  log: ReviewActivityLike,
): Promise<number> {
  try {
    const inputs = await mapReviewActivityToClientEvents(log);
    let n = 0;
    for (const input of inputs) {
      if (await recordClientEvent(input)) n += 1;
    }
    return n;
  } catch (error) {
    console.error("Failed to map review activity to client events:", error);
    return 0;
  }
}
