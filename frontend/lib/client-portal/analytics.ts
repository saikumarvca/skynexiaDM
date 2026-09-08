import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import ClientEvent from "@/models/ClientEvent";
import {
  eachDay,
  pctChange,
  type ClientDateRange,
} from "@/lib/client-portal/date-range";
import {
  CLIENT_REVIEW_STATUSES,
  CLIENT_REVIEW_STATUS_LABEL,
  type ClientActivityItem,
  type ClientDashboardData,
  type ClientKpi,
  type ClientReviewAnalytics,
  type ClientReviewStatus,
  type ClientStatusSlice,
  type ClientTrendPoint,
} from "@/lib/client-portal/dto";
import { loadClientReviewRows, type ReviewRow } from "@/lib/client-portal/reviews";

/**
 * Dashboard and analytics numbers. Every figure derives from stored review
 * timestamps (draft createdAt, allocation assignedDate/sentDate, posted
 * postedDate); nothing is estimated.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

function within(d: Date | null | undefined, from: Date, to: Date): boolean {
  return !!d && d.getTime() >= from.getTime() && d.getTime() <= to.getTime();
}

function endOfDay(iso: string): number {
  return new Date(`${iso}T23:59:59.999Z`).getTime();
}

/** Status of one allocation row as of the end of a given day. */
function statusOn(row: ReviewRow, dayEnd: number): ClientReviewStatus | null {
  if (row.kind === "draft") {
    if (row.createdAtDate.getTime() > dayEnd) return null;
    if (row.allocatedAt && row.allocatedAt.getTime() <= dayEnd) return null;
    return "DRAFT";
  }
  const start = (row.assignedAt ?? row.createdAtDate).getTime();
  if (start > dayEnd) return null;
  if (row.postedAt && row.postedAt.getTime() <= dayEnd) return "POSTED";
  if (row.sharedAt && row.sharedAt.getTime() <= dayEnd) return "SHARED";
  return "IN_PROGRESS";
}

export function buildTrend(
  rows: ReviewRow[],
  draftLifecycles: { createdAt: Date; allocatedAt: Date | null }[],
  range: ClientDateRange,
): ClientTrendPoint[] {
  const days = eachDay(range);
  // Draft rows that are already allocated are not in `rows`; the lifecycle
  // list lets earlier days still count them as drafts.
  const allocatedDrafts = draftLifecycles.filter((d) => d.allocatedAt);
  const stride = days.length > 120 ? Math.ceil(days.length / 120) : 1;
  const points: ClientTrendPoint[] = [];
  days.forEach((day, i) => {
    if (i % stride !== 0 && i !== days.length - 1) return;
    const dayEnd = endOfDay(day);
    const p: ClientTrendPoint = { date: day, total: 0, posted: 0, shared: 0, inProgress: 0, drafts: 0 };
    for (const r of rows) {
      const s = statusOn(r, dayEnd);
      if (!s) continue;
      if (s === "POSTED") p.posted += 1;
      else if (s === "SHARED") p.shared += 1;
      else if (s === "IN_PROGRESS") p.inProgress += 1;
      else p.drafts += 1;
    }
    for (const d of allocatedDrafts) {
      if (d.createdAt.getTime() <= dayEnd && d.allocatedAt!.getTime() > dayEnd) p.drafts += 1;
    }
    p.total = p.posted + p.shared + p.inProgress + p.drafts;
    points.push(p);
  });
  return points;
}

function statusSlices(rows: ReviewRow[]): { total: number; slices: ClientStatusSlice[] } {
  const total = rows.length;
  const slices = CLIENT_REVIEW_STATUSES.map((status) => {
    const count = rows.filter((r) => r.status === status).length;
    return {
      status,
      label: CLIENT_REVIEW_STATUS_LABEL[status],
      count,
      pct: total > 0 ? Math.round((count / total) * 100) : 0,
    };
  });
  return { total, slices };
}

function buildKpis(
  rows: ReviewRow[],
  draftLifecycles: { createdAt: Date; allocatedAt: Date | null }[],
  range: ClientDateRange,
): ClientKpi[] {
  const cur = (d: Date | null | undefined) => within(d, range.from, range.to);
  const prev = (d: Date | null | undefined) => within(d, range.previousFrom, range.previousTo);
  const count = (pred: (r: ReviewRow) => boolean) => rows.filter(pred).length;

  const kpi = (
    key: ClientKpi["key"],
    label: string,
    value: number,
    periodValue: number,
    previousPeriodValue: number,
  ): ClientKpi => ({
    key,
    label,
    value,
    periodValue,
    previousPeriodValue,
    changePct: pctChange(periodValue, previousPeriodValue),
  });

  const draftsCreatedCur = draftLifecycles.filter((d) => cur(d.createdAt)).length;
  const draftsCreatedPrev = draftLifecycles.filter((d) => prev(d.createdAt)).length;
  const allocationsCur = count((r) => r.kind === "allocation" && cur(r.createdAtDate));
  const allocationsPrev = count((r) => r.kind === "allocation" && prev(r.createdAtDate));

  return [
    // "New" total reviews = rows that started in the period (an allocation, or a
    // draft that is still unallocated), so a draft allocated in the same period
    // is counted once.
    kpi(
      "total",
      "Total Reviews",
      rows.length,
      count((r) => cur(r.createdAtDate)),
      count((r) => prev(r.createdAtDate)),
    ),
    kpi(
      "posted",
      "Posted Reviews",
      count((r) => r.status === "POSTED"),
      count((r) => cur(r.postedAt)),
      count((r) => prev(r.postedAt)),
    ),
    kpi(
      "shared",
      "Shared with You",
      count((r) => r.status === "SHARED"),
      count((r) => cur(r.sharedAt)),
      count((r) => prev(r.sharedAt)),
    ),
    kpi(
      "inProgress",
      "In Progress",
      count((r) => r.status === "IN_PROGRESS"),
      allocationsCur,
      allocationsPrev,
    ),
    kpi("drafts", "Drafts", count((r) => r.status === "DRAFT"), draftsCreatedCur, draftsCreatedPrev),
  ];
}

export function toActivityItem(e: {
  _id: unknown;
  entityType: ClientActivityItem["entityType"];
  action: string;
  title: string;
  description?: string;
  actorName?: string | null;
  actorRole: ClientActivityItem["actorRole"];
  category: ClientActivityItem["category"];
  relatedReviewId?: unknown;
  relatedLabel?: string | null;
  occurredAt: Date;
}): ClientActivityItem {
  return {
    id: String(e._id),
    entityType: e.entityType,
    action: e.action,
    title: e.title,
    description: e.description ?? "",
    actorName: e.actorName ?? null,
    actorRole: e.actorRole,
    category: e.category,
    relatedReviewId: e.relatedReviewId ? String(e.relatedReviewId) : null,
    relatedLabel: e.relatedLabel ?? null,
    occurredAt: new Date(e.occurredAt).toISOString(),
  };
}

export async function getRecentClientActivity(
  clientId: string,
  limit = 8,
): Promise<ClientActivityItem[]> {
  await dbConnect();
  const events = await ClientEvent.find({
    clientId: new mongoose.Types.ObjectId(clientId),
    visibility: "CLIENT_VISIBLE",
  })
    .select("_id entityType action title description actorName actorRole category relatedReviewId relatedLabel occurredAt")
    .sort({ occurredAt: -1 })
    .limit(limit)
    .lean();
  return events.map((e) => toActivityItem(e as Parameters<typeof toActivityItem>[0]));
}

function rangeDto(range: ClientDateRange): ClientDashboardData["range"] {
  return {
    key: range.key,
    from: range.fromIso,
    to: range.toIso,
    label: range.label,
    previousFrom: range.previousFromIso,
    previousTo: range.previousToIso,
  };
}

export async function getClientDashboardData(
  clientId: string,
  range: ClientDateRange,
): Promise<ClientDashboardData> {
  const [{ rows, draftLifecycles }, recentActivity] = await Promise.all([
    loadClientReviewRows(clientId),
    getRecentClientActivity(clientId, 8),
  ]);
  const kpis = buildKpis(rows, draftLifecycles, range);
  const posted = kpis.find((k) => k.key === "posted")!;
  return {
    range: rangeDto(range),
    kpis,
    trend: buildTrend(rows, draftLifecycles, range),
    status: statusSlices(rows),
    recentActivity,
    highlight: {
      postedThisPeriod: posted.periodValue,
      postedPreviousPeriod: posted.previousPeriodValue,
      changePct: posted.changePct,
    },
  };
}

export async function getClientReviewAnalytics(
  clientId: string,
  range: ClientDateRange,
  now = new Date(),
): Promise<ClientReviewAnalytics> {
  const { rows, draftLifecycles } = await loadClientReviewRows(clientId);
  const posted = rows.filter((r) => r.status === "POSTED");
  const rated = posted.filter((r) => r.rating != null);
  const ratedCount = rated.length;
  const averageRating =
    ratedCount > 0
      ? Math.round((rated.reduce((s, r) => s + (r.rating ?? 0), 0) / ratedCount) * 10) / 10
      : null;
  const positivePct =
    ratedCount > 0
      ? Math.round((rated.filter((r) => (r.rating ?? 0) >= 4).length / ratedCount) * 100)
      : null;

  const byRating = [1, 2, 3, 4, 5].map((rating) => ({
    rating,
    count: rated.filter((r) => r.rating === rating).length,
  }));

  const platformMap = new Map<string, { posted: number; shared: number; inProgress: number }>();
  for (const r of rows) {
    if (!r.platform) continue;
    const entry = platformMap.get(r.platform) ?? { posted: 0, shared: 0, inProgress: 0 };
    if (r.status === "POSTED") entry.posted += 1;
    else if (r.status === "SHARED") entry.shared += 1;
    else if (r.status === "IN_PROGRESS") entry.inProgress += 1;
    platformMap.set(r.platform, entry);
  }
  const byPlatform = Array.from(platformMap.entries())
    .map(([platform, v]) => ({ platform, ...v, total: v.posted + v.shared + v.inProgress }))
    .sort((a, b) => b.total - a.total || a.platform.localeCompare(b.platform));

  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const lastMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const lastMonthEnd = new Date(monthStart.getTime() - 1);
  const postedThisMonth = posted.filter((r) => within(r.postedAt, monthStart, now)).length;
  const postedLastMonth = posted.filter((r) => within(r.postedAt, lastMonthStart, lastMonthEnd)).length;

  const durations = posted
    .filter((r) => r.sharedAt && r.postedAt && r.postedAt.getTime() >= r.sharedAt.getTime())
    .map((r) => (r.postedAt!.getTime() - r.sharedAt!.getTime()) / DAY_MS);
  const avgDaysSharedToPosted =
    durations.length > 0
      ? Math.round((durations.reduce((s, d) => s + d, 0) / durations.length) * 10) / 10
      : null;

  return {
    range: rangeDto(range),
    summary: {
      averageRating,
      positivePct,
      posted: posted.length,
      shared: rows.filter((r) => r.status === "SHARED").length,
      total: rows.length,
      ratedCount,
    },
    byRating,
    byPlatform,
    trend: buildTrend(rows, draftLifecycles, range),
    performance: {
      postedThisMonth,
      postedLastMonth,
      changePct: pctChange(postedThisMonth, postedLastMonth),
      avgDaysSharedToPosted,
      sampleSize: durations.length,
    },
  };
}
