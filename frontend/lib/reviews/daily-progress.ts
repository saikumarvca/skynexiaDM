import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import ReviewDraft from "@/models/ReviewDraft";
import ReviewAllocation from "@/models/ReviewAllocation";
import PostedReview from "@/models/PostedReview";

/**
 * Daily review progress: how many review drafts were shared with customers and
 * how many were posted, per calendar day (UTC, matching how the date inputs are
 * stored), optionally scoped to one client.
 *
 * - "Shared" = ReviewAllocation.sentDate (set by the Mark Shared flow) for
 *   allocations that are still Shared / Posted / Used (cancelled ones drop out).
 * - "Posted" = PostedReview.postedDate (the user-entered posting date created by
 *   both the Mark Posted and Mark Used flows).
 */

export type DailyProgressDay = {
  /** yyyy-mm-dd (UTC) */
  date: string;
  shared: number;
  posted: number;
};

export type DailyProgressResult = {
  clientId: string | null;
  /** yyyy-mm-dd inclusive */
  from: string;
  /** yyyy-mm-dd inclusive */
  to: string;
  /** Ascending by date; every day in the range is present (zero-filled). */
  days: DailyProgressDay[];
  totals: { shared: number; posted: number };
};

export type DailyProgressScope = {
  isAdmin: boolean;
  accountType: "MAIN_EMPLOYEE" | "PARTNER_AGENCY" | "PARTNER_EMPLOYEE";
  partnerAgencyId?: string;
  assignedClientIds: string[];
};

export const DAILY_PROGRESS_DEFAULT_DAYS = 30;
export const DAILY_PROGRESS_MAX_DAYS = 366;

const DAY_MS = 24 * 60 * 60 * 1000;

export function toIsoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function parseIsoDay(iso: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const d = new Date(`${iso}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function shiftDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * DAY_MS);
}

/**
 * Turn optional yyyy-mm-dd bounds into a valid inclusive range.
 * Missing `to` → today (UTC). Missing `from` → `to` minus the default window.
 * Reversed bounds are swapped; over-long ranges are clamped from the `to` end.
 */
export function normalizeDailyProgressRange(
  fromIso?: string | null,
  toIso?: string | null,
  defaultDays = DAILY_PROGRESS_DEFAULT_DAYS,
): { from: string; to: string } {
  const todayStart = parseIsoDay(toIsoDay(new Date()))!;
  let to = (toIso && parseIsoDay(toIso)) || todayStart;
  let from = (fromIso && parseIsoDay(fromIso)) || shiftDays(to, -(defaultDays - 1));

  if (from.getTime() > to.getTime()) {
    const tmp = from;
    from = to;
    to = tmp;
  }

  const span = Math.round((to.getTime() - from.getTime()) / DAY_MS) + 1;
  if (span > DAILY_PROGRESS_MAX_DAYS) {
    from = shiftDays(to, -(DAILY_PROGRESS_MAX_DAYS - 1));
  }

  return { from: toIsoDay(from), to: toIsoDay(to) };
}

function emptyResult(
  clientId: string | null,
  from: string,
  to: string,
): DailyProgressResult {
  return {
    clientId,
    from,
    to,
    days: fillDays(from, to, {}, {}),
    totals: { shared: 0, posted: 0 },
  };
}

function fillDays(
  from: string,
  to: string,
  shared: Record<string, number>,
  posted: Record<string, number>,
): DailyProgressDay[] {
  const start = parseIsoDay(from)!;
  const end = parseIsoDay(to)!;
  const out: DailyProgressDay[] = [];
  for (let t = start.getTime(); t <= end.getTime(); t += DAY_MS) {
    const key = toIsoDay(new Date(t));
    out.push({ date: key, shared: shared[key] ?? 0, posted: posted[key] ?? 0 });
  }
  return out;
}

export class DailyProgressScopeError extends Error {
  constructor() {
    super("FORBIDDEN_SCOPE");
    this.name = "DailyProgressScopeError";
  }
}

function toObjectIds(ids: string[]): mongoose.Types.ObjectId[] {
  return ids
    .filter((id) => mongoose.isValidObjectId(id))
    .map((id) => new mongoose.Types.ObjectId(id));
}

export async function getReviewDailyProgress(params: {
  clientId?: string | null;
  from: string;
  to: string;
  scope: DailyProgressScope;
}): Promise<DailyProgressResult> {
  const { from, to, scope } = params;
  const clientId = params.clientId?.trim() || null;

  await dbConnect();

  const fromDate = new Date(`${from}T00:00:00.000Z`);
  const toDate = new Date(`${to}T23:59:59.999Z`);

  const isPartner =
    scope.accountType === "PARTNER_AGENCY" ||
    scope.accountType === "PARTNER_EMPLOYEE";

  // ── Resolve which drafts are in scope ────────────────────────────────────
  const draftQuery: Record<string, unknown> = {};

  if (clientId) {
    if (!mongoose.isValidObjectId(clientId)) {
      return emptyResult(clientId, from, to);
    }
    if (
      !scope.isAdmin &&
      !isPartner &&
      scope.assignedClientIds.length > 0 &&
      !scope.assignedClientIds.includes(clientId)
    ) {
      throw new DailyProgressScopeError();
    }
    draftQuery.clientId = new mongoose.Types.ObjectId(clientId);
  } else if (!scope.isAdmin && !isPartner && scope.assignedClientIds.length > 0) {
    draftQuery.clientId = { $in: toObjectIds(scope.assignedClientIds) };
  }

  if (!scope.isAdmin && isPartner) {
    if (!scope.partnerAgencyId || !mongoose.isValidObjectId(scope.partnerAgencyId)) {
      return emptyResult(clientId, from, to);
    }
    draftQuery.assignedPartnerAgencyId = new mongoose.Types.ObjectId(
      scope.partnerAgencyId,
    );
  }

  let draftMatch: Record<string, unknown> = {};
  if (Object.keys(draftQuery).length > 0) {
    const drafts = await ReviewDraft.find(draftQuery).select("_id").lean();
    const draftIds = drafts.map((d) => d._id as mongoose.Types.ObjectId);
    if (draftIds.length === 0) return emptyResult(clientId, from, to);
    draftMatch = { draftId: { $in: draftIds } };
  }

  // ── Aggregate per UTC day ────────────────────────────────────────────────
  type Row = { _id: string; count: number };
  const [sharedRows, postedRows] = await Promise.all([
    ReviewAllocation.aggregate<Row>([
      {
        $match: {
          ...draftMatch,
          sentDate: { $gte: fromDate, $lte: toDate },
          allocationStatus: { $in: ["Shared with Customer", "Posted", "Used"] },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$sentDate" } },
          count: { $sum: 1 },
        },
      },
    ]),
    PostedReview.aggregate<Row>([
      {
        $match: {
          ...draftMatch,
          postedDate: { $gte: fromDate, $lte: toDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$postedDate" } },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const sharedByDay: Record<string, number> = {};
  for (const r of sharedRows) if (r._id) sharedByDay[r._id] = r.count;
  const postedByDay: Record<string, number> = {};
  for (const r of postedRows) if (r._id) postedByDay[r._id] = r.count;

  const days = fillDays(from, to, sharedByDay, postedByDay);
  const totals = days.reduce(
    (acc, d) => {
      acc.shared += d.shared;
      acc.posted += d.posted;
      return acc;
    },
    { shared: 0, posted: 0 },
  );

  return { clientId, from, to, days, totals };
}
