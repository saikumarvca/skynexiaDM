"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  ArrowUpRight,
  CalendarDays,
  Download,
  Share2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type {
  DailyProgressDay,
  DailyProgressMember,
  DailyProgressResult,
} from "@/lib/reviews/daily-progress";

export type DailyProgressClientOption = { id: string; label: string };

// Series colors validated for both light and dark surfaces (CVD-safe pair).
const SHARED_COLOR = "#2a78d6";
const POSTED_COLOR = "#008300";

const ALL = "ALL";
const DAY_MS = 24 * 60 * 60 * 1000;

function isoDay(d: Date) {
  return d.toISOString().slice(0, 10);
}
function todayIso() {
  return isoDay(new Date());
}
function shiftIso(iso: string, days: number) {
  return isoDay(
    new Date(new Date(`${iso}T00:00:00.000Z`).getTime() + days * DAY_MS),
  );
}
function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00.000Z`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
function formatWeekday(iso: string) {
  return new Date(`${iso}T00:00:00.000Z`).toLocaleDateString("en-GB", {
    weekday: "short",
    timeZone: "UTC",
  });
}

type Filters = { clientId: string; from: string; to: string };

/** Query for fetching data (member filtering happens client-side). */
function buildFetchQuery(f: Filters) {
  const qs = new URLSearchParams({ dateFrom: f.from, dateTo: f.to });
  if (f.clientId && f.clientId !== ALL) qs.set("clientId", f.clientId);
  return qs;
}

/** Query for the shareable URL and CSV download (includes the member). */
function buildUrlQuery(f: Filters, memberId: string) {
  const qs = buildFetchQuery(f);
  if (memberId && memberId !== ALL) qs.set("memberId", memberId);
  return qs;
}

/** Expand a member's sparse day list onto the full day template. */
function zeroFill(
  template: DailyProgressDay[],
  sparse: DailyProgressDay[],
): DailyProgressDay[] {
  const byDate = new Map(sparse.map((d) => [d.date, d]));
  return template.map((d) => {
    const s = byDate.get(d.date);
    return { date: d.date, shared: s?.shared ?? 0, posted: s?.posted ?? 0 };
  });
}

const PRESETS: {
  key: string;
  label: string;
  range: (today: string) => { from: string; to: string };
}[] = [
  { key: "7", label: "7 days", range: (t) => ({ from: shiftIso(t, -6), to: t }) },
  { key: "14", label: "14 days", range: (t) => ({ from: shiftIso(t, -13), to: t }) },
  { key: "30", label: "30 days", range: (t) => ({ from: shiftIso(t, -29), to: t }) },
  {
    key: "month",
    label: "This month",
    range: (t) => ({ from: `${t.slice(0, 7)}-01`, to: t }),
  },
];

interface DailyProgressCardProps {
  /** Server-rendered result for the initial filters (null → fetched on mount). */
  initialData: DailyProgressResult | null;
  /** Clients offered in the selector. Ignored when `lockedClient` is set. */
  clients?: DailyProgressClientOption[];
  initialClientId?: string | null;
  /** Team member pre-selected in the member filter (client-side filter). */
  initialMemberId?: string | null;
  /** Pin the card to one client (no selector). */
  lockedClient?: { id: string; name: string };
  /** Mirror the active filters into the URL query so the view is shareable. */
  syncUrl?: boolean;
  /** Optional link to the full analytics page (used on the client page). */
  analyticsHref?: string;
  title?: string;
  description?: string;
}

export function DailyProgressCard({
  initialData,
  clients = [],
  initialClientId,
  initialMemberId,
  lockedClient,
  syncUrl = false,
  analyticsHref,
  title = "Daily review progress",
  description = "Reviews shared with customers and reviews posted, per day.",
}: DailyProgressCardProps) {
  const pathname = usePathname();

  const [filters, setFilters] = useState<Filters>(() => ({
    clientId: lockedClient?.id ?? initialClientId ?? ALL,
    from: initialData?.from ?? shiftIso(todayIso(), -29),
    to: initialData?.to ?? todayIso(),
  }));
  const [memberId, setMemberId] = useState<string>(initialMemberId || ALL);
  const [data, setData] = useState<DailyProgressResult | null>(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [activeOnly, setActiveOnly] = useState(false);

  const requestId = useRef(0);
  // Query key already reflected in `data`; prevents a duplicate fetch on mount
  // (and under React strict mode) when the server supplied initial data.
  const loadedKey = useRef<string>(
    initialData
      ? buildFetchQuery({
          clientId: lockedClient?.id ?? initialClientId ?? ALL,
          from: initialData.from,
          to: initialData.to,
        }).toString()
      : "",
  );
  const urlKey = useRef<string | null>(null);

  const load = useCallback(async (f: Filters) => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/review-analytics/daily-progress?${buildFetchQuery(f).toString()}`,
        { cache: "no-store" },
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error ?? "Failed to load daily progress");
      }
      const json = (await res.json()) as DailyProgressResult;
      if (id !== requestId.current) return;
      setData(json);
    } catch (err) {
      if (id !== requestId.current) return;
      setError(
        err instanceof Error ? err.message : "Failed to load daily progress",
      );
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  // Fetch when client/range change.
  useEffect(() => {
    const key = buildFetchQuery(filters).toString();
    if (loadedKey.current === key) return;
    loadedKey.current = key;
    void load(filters);
  }, [filters, load]);

  // Keep the URL in sync (only after the user changes something).
  useEffect(() => {
    if (!syncUrl || typeof window === "undefined") return;
    const key = buildUrlQuery(filters, memberId).toString();
    if (urlKey.current === null) {
      urlKey.current = key;
      return;
    }
    if (urlKey.current === key) return;
    urlKey.current = key;
    window.history.replaceState(window.history.state, "", `${pathname}?${key}`);
  }, [filters, memberId, syncUrl, pathname]);

  // ── Derived ──────────────────────────────────────────────────────────────
  const today = todayIso();
  const allDays = useMemo(() => data?.days ?? [], [data]);
  const members = useMemo(() => data?.members ?? [], [data]);

  const selectedMember = useMemo<DailyProgressMember | null>(
    () =>
      memberId !== ALL
        ? members.find((m) => m.memberId === memberId) ?? null
        : null,
    [members, memberId],
  );
  const effectiveMemberId = selectedMember ? selectedMember.memberId : ALL;

  const days = useMemo(
    () => (selectedMember ? zeroFill(allDays, selectedMember.days) : allDays),
    [allDays, selectedMember],
  );
  const totals = selectedMember
    ? { shared: selectedMember.shared, posted: selectedMember.posted }
    : data?.totals ?? { shared: 0, posted: 0 };

  const maxValue = useMemo(
    () => Math.max(1, ...days.map((d) => Math.max(d.shared, d.posted))),
    [days],
  );
  const rowsNewestFirst = useMemo(() => {
    const withCumulative = days.reduce<
      Array<DailyProgressDay & { cumulativePosted: number }>
    >((acc, d) => {
      const previous = acc.length > 0 ? acc[acc.length - 1].cumulativePosted : 0;
      acc.push({ ...d, cumulativePosted: previous + d.posted });
      return acc;
    }, []);
    return withCumulative.reverse();
  }, [days]);
  const visibleRows = activeOnly
    ? rowsNewestFirst.filter((r) => r.shared > 0 || r.posted > 0)
    : rowsNewestFirst;
  const todayRow = days.find((d) => d.date === today);
  const activeDays = days.filter((d) => d.shared > 0 || d.posted > 0).length;

  const memberMax = useMemo(
    () => Math.max(1, ...members.map((m) => Math.max(m.shared, m.posted))),
    [members],
  );
  const memberTotals = useMemo(
    () =>
      members.reduce(
        (acc, m) => {
          acc.shared += m.shared;
          acc.posted += m.posted;
          return acc;
        },
        { shared: 0, posted: 0 },
      ),
    [members],
  );

  const clientOptions = useMemo(() => {
    const list = [...clients];
    const current = filters.clientId;
    if (current !== ALL && !list.some((c) => c.id === current)) {
      list.unshift({ id: current, label: "Selected client" });
    }
    return list;
  }, [clients, filters.clientId]);

  const clientLabel =
    lockedClient?.name ??
    (filters.clientId === ALL
      ? "All clients"
      : clientOptions.find((c) => c.id === filters.clientId)?.label ??
        "Selected client");

  const activePreset = PRESETS.find((p) => {
    const r = p.range(today);
    return r.from === filters.from && r.to === filters.to;
  })?.key;

  const csvHref = `/api/review-analytics/daily-progress?${buildUrlQuery(filters, effectiveMemberId).toString()}&format=csv`;

  // ── Handlers ─────────────────────────────────────────────────────────────
  function setRange(from: string, to: string) {
    if (!from || !to) return;
    const [a, b] = from <= to ? [from, to] : [to, from];
    setFilters((f) => ({ ...f, from: a, to: b }));
  }

  return (
    <Card className="border-border/80">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4 text-primary" aria-hidden />
              {title}
            </CardTitle>
            <CardDescription className="mt-1">
              {description}{" "}
              <span className="font-medium text-foreground">{clientLabel}</span>
              {selectedMember ? (
                <>
                  {" · "}
                  <span className="font-medium text-foreground">
                    {selectedMember.name}
                  </span>
                </>
              ) : null}
              {" · "}
              {formatDate(filters.from)} – {formatDate(filters.to)}
            </CardDescription>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={csvHref} download>
                <Download className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                Download CSV
              </a>
            </Button>
            {analyticsHref ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={analyticsHref}>
                  Review analytics
                  <ArrowUpRight className="ml-1 h-3.5 w-3.5" aria-hidden />
                </Link>
              </Button>
            ) : null}
          </div>
        </div>

        {/* Filters */}
        <div className="mt-3 flex flex-wrap items-end gap-3">
          {lockedClient ? null : (
            <div className="min-w-[220px]">
              <label
                htmlFor="daily-progress-client"
                className="mb-1 block text-xs font-medium text-muted-foreground"
              >
                Client
              </label>
              <Select
                value={filters.clientId}
                onValueChange={(v) =>
                  setFilters((f) => ({ ...f, clientId: v }))
                }
              >
                <SelectTrigger
                  id="daily-progress-client"
                  className="h-9 w-full sm:w-[260px]"
                >
                  <SelectValue placeholder="All clients" />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-72">
                  <SelectItem value={ALL}>All clients</SelectItem>
                  {clientOptions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="min-w-[200px]">
            <label
              htmlFor="daily-progress-member"
              className="mb-1 block text-xs font-medium text-muted-foreground"
            >
              Team member
            </label>
            <Select value={effectiveMemberId} onValueChange={setMemberId}>
              <SelectTrigger
                id="daily-progress-member"
                className="h-9 w-full sm:w-[220px]"
              >
                <SelectValue placeholder="All team members" />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-72">
                <SelectItem value={ALL}>All team members</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.memberId} value={m.memberId}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label
              htmlFor="daily-progress-from"
              className="mb-1 block text-xs font-medium text-muted-foreground"
            >
              From
            </label>
            <input
              id="daily-progress-from"
              type="date"
              value={filters.from}
              max={filters.to}
              onChange={(e) => setRange(e.target.value, filters.to)}
              className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="daily-progress-to"
              className="mb-1 block text-xs font-medium text-muted-foreground"
            >
              To
            </label>
            <input
              id="daily-progress-to"
              type="date"
              value={filters.to}
              min={filters.from}
              onChange={(e) => setRange(filters.from, e.target.value)}
              className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
            />
          </div>
          <div
            className="flex flex-wrap gap-1"
            role="group"
            aria-label="Quick ranges"
          >
            {PRESETS.map((p) => (
              <Button
                key={p.key}
                type="button"
                size="sm"
                variant={activePreset === p.key ? "secondary" : "ghost"}
                className="h-9"
                onClick={() => {
                  const r = p.range(today);
                  setRange(r.from, r.to);
                }}
              >
                {p.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        {/* Summary tiles */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryTile
            icon={Share2}
            label="Shared with customer"
            value={totals.shared}
            hint={selectedMember ? `by ${selectedMember.name}` : "in selected range"}
            swatch={SHARED_COLOR}
          />
          <SummaryTile
            icon={Upload}
            label="Posted"
            value={totals.posted}
            hint={selectedMember ? `by ${selectedMember.name}` : "in selected range"}
            swatch={POSTED_COLOR}
          />
          <SummaryTile
            icon={CalendarDays}
            label="Today"
            value={
              todayRow
                ? `${todayRow.shared} shared · ${todayRow.posted} posted`
                : "Not in range"
            }
            hint={formatDate(today)}
          />
          <SummaryTile
            icon={Activity}
            label="Active days"
            value={`${activeDays} of ${days.length}`}
            hint="days with any shares or posts"
          />
        </div>

        {/* By team member */}
        <section className="space-y-2" aria-labelledby="daily-progress-members">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3
              id="daily-progress-members"
              className="flex items-center gap-2 text-sm font-semibold"
            >
              <Users className="h-4 w-4 text-primary" aria-hidden />
              By team member
              <span className="font-normal text-muted-foreground">
                · {formatDate(filters.from)} – {formatDate(filters.to)}
              </span>
            </h3>
            {selectedMember ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={() => setMemberId(ALL)}
              >
                <X className="mr-1 h-3.5 w-3.5" aria-hidden />
                Show all members
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground">
                Click a name to see that member&apos;s day-by-day progress
              </span>
            )}
          </div>
          <div
            className={cn(
              "max-w-full overflow-x-auto rounded-lg border bg-card transition-opacity",
              loading && "opacity-60",
            )}
            aria-busy={loading}
          >
            <Table className="min-w-[640px]">
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="w-[220px] font-semibold text-foreground">
                    Team member
                  </TableHead>
                  <TableHead className="w-[170px] font-semibold text-foreground">
                    Today
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">
                    Shared
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">
                    Posted
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-6 text-center text-sm text-muted-foreground"
                    >
                      No team activity in this range.
                    </TableCell>
                  </TableRow>
                ) : (
                  members.map((m) => {
                    const t = m.days.find((d) => d.date === today);
                    const isSelected = m.memberId === effectiveMemberId;
                    return (
                      <TableRow
                        key={m.memberId}
                        className={cn(
                          isSelected && "bg-primary/5 hover:bg-primary/10",
                        )}
                      >
                        <TableCell>
                          <button
                            type="button"
                            onClick={() =>
                              setMemberId(isSelected ? ALL : m.memberId)
                            }
                            aria-pressed={isSelected}
                            className={cn(
                              "max-w-full truncate text-left font-medium underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm",
                              isSelected && "text-primary",
                            )}
                            title={m.name}
                          >
                            {m.name}
                          </button>
                        </TableCell>
                        <TableCell className="font-mono text-sm tabular-nums">
                          {t ? (
                            <>
                              <span>{t.shared}</span>
                              <span className="text-muted-foreground"> shared · </span>
                              <span>{t.posted}</span>
                              <span className="text-muted-foreground"> posted</span>
                            </>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <BarCell
                            value={m.shared}
                            max={memberMax}
                            color={SHARED_COLOR}
                            label="shared"
                          />
                        </TableCell>
                        <TableCell>
                          <BarCell
                            value={m.posted}
                            max={memberMax}
                            color={POSTED_COLOR}
                            label="posted"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
              {members.length > 1 ? (
                <TableFooter>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableCell className="font-semibold">All members</TableCell>
                    <TableCell className="font-mono text-sm tabular-nums">
                      {data?.days.find((d) => d.date === today)
                        ? `${data.days.find((d) => d.date === today)!.shared} shared · ${data.days.find((d) => d.date === today)!.posted} posted`
                        : "—"}
                    </TableCell>
                    <TableCell className="font-mono font-semibold tabular-nums">
                      {memberTotals.shared}
                    </TableCell>
                    <TableCell className="font-mono font-semibold tabular-nums">
                      {memberTotals.posted}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              ) : null}
            </Table>
          </div>
        </section>

        {/* By day */}
        <section className="space-y-2" aria-labelledby="daily-progress-days">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3
              id="daily-progress-days"
              className="flex items-center gap-2 text-sm font-semibold"
            >
              <CalendarDays className="h-4 w-4 text-primary" aria-hidden />
              By day
              {selectedMember ? (
                <span className="font-normal text-muted-foreground">
                  · {selectedMember.name}
                </span>
              ) : null}
            </h3>
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2.5 w-4 rounded-sm"
                  style={{ backgroundColor: SHARED_COLOR }}
                  aria-hidden
                />
                Shared
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2.5 w-4 rounded-sm"
                  style={{ backgroundColor: POSTED_COLOR }}
                  aria-hidden
                />
                Posted
              </span>
              {loading ? (
                <span className="animate-pulse" aria-live="polite">
                  Updating…
                </span>
              ) : null}
              <label className="flex cursor-pointer items-center gap-2 select-none">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 accent-primary"
                  checked={activeOnly}
                  onChange={(e) => setActiveOnly(e.target.checked)}
                />
                Only days with activity
              </label>
            </div>
          </div>

          <div
            className={cn(
              "max-w-full overflow-x-auto rounded-lg border bg-card transition-opacity",
              loading && "opacity-60",
            )}
            aria-busy={loading}
          >
            <Table className="min-w-[640px]">
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="w-[220px] font-semibold text-foreground">
                    Date
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">
                    Shared
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">
                    Posted
                  </TableHead>
                  <TableHead className="w-[150px] text-right font-semibold text-foreground">
                    Posted to date
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleRows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      {days.length === 0
                        ? "No data for this range."
                        : "No reviews were shared or posted in this range."}
                    </TableCell>
                  </TableRow>
                ) : (
                  visibleRows.map((row) => {
                    const isToday = row.date === today;
                    const quiet = row.shared === 0 && row.posted === 0;
                    return (
                      <TableRow
                        key={row.date}
                        className={cn(isToday && "bg-primary/5 hover:bg-primary/10")}
                      >
                        <TableCell className={cn(quiet && "text-muted-foreground")}>
                          <div className="flex items-center gap-2">
                            <span className="tabular-nums">
                              {formatDate(row.date)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatWeekday(row.date)}
                            </span>
                            {isToday ? (
                              <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                                Today
                              </span>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <BarCell
                            value={row.shared}
                            max={maxValue}
                            color={SHARED_COLOR}
                            label="shared"
                          />
                        </TableCell>
                        <TableCell>
                          <BarCell
                            value={row.posted}
                            max={maxValue}
                            color={POSTED_COLOR}
                            label="posted"
                          />
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm tabular-nums text-muted-foreground">
                          {row.cumulativePosted}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
              {days.length > 0 ? (
                <TableFooter>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableCell className="font-semibold">Total</TableCell>
                    <TableCell className="font-mono font-semibold tabular-nums">
                      {totals.shared}
                    </TableCell>
                    <TableCell className="font-mono font-semibold tabular-nums">
                      {totals.posted}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold tabular-nums">
                      {totals.posted}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              ) : null}
            </Table>
          </div>
        </section>
      </CardContent>
    </Card>
  );
}

// ─── Pieces ───────────────────────────────────────────────────────────────────

function SummaryTile({
  icon: Icon,
  label,
  value,
  hint,
  swatch,
}: {
  icon: typeof Share2;
  label: string;
  value: string | number;
  hint?: string;
  swatch?: string;
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/60 px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
        <span className="flex items-center gap-1.5">
          {swatch ? (
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: swatch }}
              aria-hidden
            />
          ) : null}
          <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
        </span>
      </div>
      <div className="mt-1 text-xl font-bold tabular-nums tracking-tight">
        {value}
      </div>
      {hint ? (
        <p className="truncate text-[11px] text-muted-foreground" title={hint}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function BarCell({
  value,
  max,
  color,
  label,
}: {
  value: number;
  max: number;
  color: string;
  label: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          "w-8 shrink-0 font-mono text-sm tabular-nums",
          value === 0 && "text-muted-foreground",
        )}
      >
        {value}
      </span>
      <div
        className="h-1.5 w-full max-w-[180px] overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={`${value} ${label}`}
      >
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
