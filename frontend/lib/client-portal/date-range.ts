/**
 * Date-range presets for the client portal. Days are UTC calendar days, the
 * same convention the review timestamps and the daily-progress report use.
 */

export type ClientRangeKey =
  | "7d"
  | "30d"
  | "90d"
  | "month"
  | "prev_month"
  | "custom";

export const CLIENT_RANGE_OPTIONS: { key: ClientRangeKey; label: string }[] = [
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "90d", label: "Last 90 days" },
  { key: "month", label: "This month" },
  { key: "prev_month", label: "Previous month" },
  { key: "custom", label: "Custom" },
];

export type ClientDateRange = {
  key: ClientRangeKey;
  label: string;
  /** Inclusive start (00:00:00.000Z). */
  from: Date;
  /** Inclusive end (23:59:59.999Z). */
  to: Date;
  fromIso: string;
  toIso: string;
  /** Equal-length window immediately before `from`. */
  previousFrom: Date;
  previousTo: Date;
  previousFromIso: string;
  previousToIso: string;
  days: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;
export const MAX_RANGE_DAYS = 366;

export function toIsoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function parseIsoDay(iso: string | null | undefined): Date | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const d = new Date(`${iso}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function startOfUtcDay(d: Date): Date {
  return new Date(`${toIsoDay(d)}T00:00:00.000Z`);
}

function endOfUtcDay(d: Date): Date {
  return new Date(`${toIsoDay(d)}T23:59:59.999Z`);
}

function shiftDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * DAY_MS);
}

function isRangeKey(v: string | null | undefined): v is ClientRangeKey {
  return CLIENT_RANGE_OPTIONS.some((o) => o.key === v);
}

export function parseClientDateRange(params: {
  range?: string | null;
  from?: string | null;
  to?: string | null;
  now?: Date;
}): ClientDateRange {
  const now = params.now ?? new Date();
  const today = startOfUtcDay(now);
  let key: ClientRangeKey = isRangeKey(params.range) ? params.range : "30d";
  let from: Date;
  let to: Date;

  switch (key) {
    case "7d":
      from = shiftDays(today, -6);
      to = today;
      break;
    case "90d":
      from = shiftDays(today, -89);
      to = today;
      break;
    case "month":
      from = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
      to = today;
      break;
    case "prev_month": {
      const firstOfThisMonth = new Date(
        Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1),
      );
      from = new Date(
        Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1),
      );
      to = shiftDays(firstOfThisMonth, -1);
      break;
    }
    case "custom": {
      const f = parseIsoDay(params.from);
      const t = parseIsoDay(params.to);
      if (!f && !t) {
        key = "30d";
        from = shiftDays(today, -29);
        to = today;
      } else {
        to = t ?? today;
        from = f ?? shiftDays(to, -29);
        if (from.getTime() > to.getTime()) {
          const tmp = from;
          from = to;
          to = tmp;
        }
      }
      break;
    }
    case "30d":
    default:
      key = "30d";
      from = shiftDays(today, -29);
      to = today;
  }

  const span = Math.round((to.getTime() - from.getTime()) / DAY_MS) + 1;
  if (span > MAX_RANGE_DAYS) from = shiftDays(to, -(MAX_RANGE_DAYS - 1));
  const days = Math.round((to.getTime() - from.getTime()) / DAY_MS) + 1;

  const previousTo = shiftDays(from, -1);
  const previousFrom = shiftDays(previousTo, -(days - 1));

  const label =
    key === "custom"
      ? `${toIsoDay(from)} to ${toIsoDay(to)}`
      : CLIENT_RANGE_OPTIONS.find((o) => o.key === key)!.label;

  return {
    key,
    label,
    from,
    to: endOfUtcDay(to),
    fromIso: toIsoDay(from),
    toIso: toIsoDay(to),
    previousFrom,
    previousTo: endOfUtcDay(previousTo),
    previousFromIso: toIsoDay(previousFrom),
    previousToIso: toIsoDay(previousTo),
    days,
  };
}

/** Every UTC day in the range, ascending. */
export function eachDay(range: ClientDateRange): string[] {
  const out: string[] = [];
  for (let t = range.from.getTime(); t <= range.to.getTime(); t += DAY_MS) {
    out.push(toIsoDay(new Date(t)));
  }
  return out;
}

export function pctChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}
