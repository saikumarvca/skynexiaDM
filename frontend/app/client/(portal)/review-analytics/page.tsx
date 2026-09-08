import { CheckCircle2, Send, Star, ThumbsUp, TrendingDown, TrendingUp, Minus, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { requireClientSession } from "@/lib/client-portal/session";
import { parseClientDateRange } from "@/lib/client-portal/date-range";
import { getClientReviewAnalytics } from "@/lib/client-portal/analytics";
import { PortalPageHeader, RatingStars, SectionCard } from "@/components/client-portal/ui/primitives";
import { DateRangePicker } from "@/components/client-portal/ui/date-range-picker";
import { TrendChart } from "@/components/client-portal/charts/trend-chart";
import { HorizontalBars, VerticalBars } from "@/components/client-portal/charts/bar-chart";
import { platformColor } from "@/components/client-portal/charts/chart-tokens";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

function SummaryTile({
  icon: Icon,
  tile,
  value,
  label,
  hint,
}: {
  icon: typeof Star;
  tile: string;
  value: React.ReactNode;
  label: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border/80 bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <span className={cn("flex h-10 w-10 items-center justify-center rounded-lg", tile)}>
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <p className="mt-4 text-[26px] font-bold leading-none tabular-nums tracking-tight">{value}</p>
      <p className="mt-1.5 text-sm text-muted-foreground">{label}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export default async function ClientReviewAnalyticsPage({ searchParams }: { searchParams: SearchParams }) {
  const ctx = await requireClientSession();
  const sp = await searchParams;
  const range = parseClientDateRange({ range: first(sp.range), from: first(sp.from), to: first(sp.to) });
  const data = await getClientReviewAnalytics(ctx.clientId, range);
  const { summary, performance } = data;

  const delta = performance.postedThisMonth - performance.postedLastMonth;
  const Trend = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const trendColor =
    delta > 0
      ? "text-emerald-600 dark:text-emerald-400"
      : delta < 0
        ? "text-red-600 dark:text-red-400"
        : "text-muted-foreground";

  const ratingBars = data.byRating.map((r) => ({
    key: String(r.rating),
    label: `${r.rating}★`,
    value: r.count,
    color: "var(--viz-total)",
    hint: `${r.count} posted review${r.count === 1 ? "" : "s"} rated ${r.rating}★`,
  }));
  const platformBars = data.byPlatform.map((p) => ({
    key: p.platform,
    label: p.platform,
    value: p.total,
    color: platformColor(p.platform),
    hint: `${p.posted} posted · ${p.shared} shared · ${p.inProgress} in progress`,
  }));

  return (
    <div className="space-y-6">
      <PortalPageHeader
        title="Review Analytics"
        subtitle="Insights and trends from your reviews"
        actions={<DateRangePicker value={range.key} from={range.fromIso} to={range.toIso} />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryTile
          icon={Star}
          tile="bg-amber-500/14 text-amber-700 dark:text-amber-400"
          value={
            summary.averageRating != null ? (
              <span className="flex items-center gap-2">
                {summary.averageRating.toFixed(1)}
                <RatingStars rating={Math.round(summary.averageRating)} size={14} />
              </span>
            ) : (
              "—"
            )
          }
          label="Average Rating"
          hint={summary.ratedCount > 0 ? `Across ${summary.ratedCount} posted reviews` : "No posted reviews yet"}
        />
        <SummaryTile
          icon={ThumbsUp}
          tile="bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
          value={summary.positivePct != null ? `${summary.positivePct}%` : "—"}
          label="Positive Reviews"
          hint="4★ and above"
        />
        <SummaryTile
          icon={CheckCircle2}
          tile="bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
          value={summary.posted}
          label="Posted Reviews"
        />
        <SummaryTile
          icon={Send}
          tile="bg-violet-500/12 text-violet-600 dark:text-violet-400"
          value={summary.shared}
          label="Shared with You"
        />
        <SummaryTile icon={Star} tile="bg-primary/10 text-primary" value={summary.total} label="Total Reviews" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <SectionCard title="Reviews by Rating" description="Posted reviews grouped by star rating">
          {summary.ratedCount === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Ratings appear once reviews are posted.
            </p>
          ) : (
            <VerticalBars bars={ratingBars} ariaLabel="Posted reviews by rating" />
          )}
        </SectionCard>
        <SectionCard title="Platform Breakdown" description="Where your reviews are being placed">
          <HorizontalBars bars={platformBars} ariaLabel="Reviews by platform" />
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <SectionCard title="Review Status Trend" description="Posted, shared and in-progress reviews over time">
          <TrendChart data={data.trend} series={["posted", "shared", "inProgress"]} ariaLabel="Review status trend" />
        </SectionCard>
        <SectionCard title="Posting Performance" description="Month-over-month momentum">
          <dl className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <dt className="text-sm text-muted-foreground">Posted this month</dt>
              <dd className="text-2xl font-bold tabular-nums">{performance.postedThisMonth}</dd>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <dt className="text-sm text-muted-foreground">Posted last month</dt>
              <dd className="text-2xl font-bold tabular-nums">{performance.postedLastMonth}</dd>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <dt className="text-sm text-muted-foreground">Change</dt>
              <dd className={cn("flex items-center gap-1.5 text-lg font-semibold tabular-nums", trendColor)}>
                <Trend className="h-4 w-4" aria-hidden />
                {performance.changePct != null
                  ? `${performance.changePct > 0 ? "+" : ""}${performance.changePct}%`
                  : performance.postedThisMonth > 0
                    ? "New"
                    : "—"}
              </dd>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                <Timer className="h-4 w-4" aria-hidden />
                Avg. shared → posted
              </dt>
              <dd className="text-right">
                <span className="text-lg font-semibold tabular-nums">
                  {performance.avgDaysSharedToPosted != null
                    ? `${performance.avgDaysSharedToPosted} days`
                    : "—"}
                </span>
                {performance.sampleSize > 0 ? (
                  <span className="block text-xs text-muted-foreground">
                    from {performance.sampleSize} review{performance.sampleSize === 1 ? "" : "s"}
                  </span>
                ) : null}
              </dd>
            </div>
          </dl>
        </SectionCard>
      </div>
    </div>
  );
}
