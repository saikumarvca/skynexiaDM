import { requireClientSession } from "@/lib/client-portal/session";
import { parseClientDateRange } from "@/lib/client-portal/date-range";
import { getClientDashboardData } from "@/lib/client-portal/analytics";
import { PortalPageHeader, SectionCard } from "@/components/client-portal/ui/primitives";
import { DateRangePicker } from "@/components/client-portal/ui/date-range-picker";
import { KpiRow } from "@/components/client-portal/dashboard/kpi-cards";
import { RecentActivity } from "@/components/client-portal/dashboard/recent-activity";
import { ProgressHighlight } from "@/components/client-portal/dashboard/progress-highlight";
import { TrendChart } from "@/components/client-portal/charts/trend-chart";
import { DonutChart } from "@/components/client-portal/charts/donut-chart";
import { SERIES_COLOR, STATUS_SERIES } from "@/components/client-portal/charts/chart-tokens";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function ClientDashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const ctx = await requireClientSession();
  const sp = await searchParams;
  const range = parseClientDateRange({
    range: first(sp.range),
    from: first(sp.from),
    to: first(sp.to),
  });
  const data = await getClientDashboardData(ctx.clientId, range);
  const clientName = ctx.businessName || ctx.clientName;
  const periodLabel = range.key === "custom" ? "in range" : `in ${range.label.toLowerCase()}`;

  return (
    <div className="space-y-6">
      <PortalPageHeader
        title={`Welcome, ${clientName}`}
        subtitle="Here's an overview of your review progress, recent updates and activity."
        actions={<DateRangePicker value={range.key} from={range.fromIso} to={range.toIso} />}
      />

      <KpiRow kpis={data.kpis} periodLabel={periodLabel} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,1.6fr)_minmax(0,1.5fr)]">
        <SectionCard
          title="Review Progress"
          description="Track how your reviews are moving over time"
          className="min-w-0"
        >
          <TrendChart data={data.trend} series={["total", "posted", "shared", "inProgress"]} />
        </SectionCard>
        <SectionCard title="Review Status" className="min-w-0">
          <DonutChart
            total={data.status.total}
            slices={data.status.slices.map((s) => ({
              key: s.status,
              label: s.label,
              count: s.count,
              pct: s.pct,
              color: SERIES_COLOR[STATUS_SERIES[s.status]],
            }))}
          />
        </SectionCard>
        <div className="min-w-0">
          <RecentActivity items={data.recentActivity} />
        </div>
      </div>

      <ProgressHighlight highlight={data.highlight} rangeLabel={range.label} />
    </div>
  );
}
