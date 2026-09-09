import type { LucideIcon } from "lucide-react";
import { CheckCircle2, Clock3, FileText, Minus, Send, Star, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ClientKpi } from "@/lib/client-portal/dto";

const KPI_STYLE: Record<ClientKpi["key"], { icon: LucideIcon; tile: string }> = {
  total: { icon: Star, tile: "bg-primary/10 text-primary" },
  posted: { icon: CheckCircle2, tile: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400" },
  shared: { icon: Send, tile: "bg-violet-500/12 text-violet-600 dark:text-violet-400" },
  inProgress: { icon: Clock3, tile: "bg-amber-500/14 text-amber-700 dark:text-amber-400" },
  drafts: { icon: FileText, tile: "bg-sky-500/12 text-sky-700 dark:text-sky-400" },
};

/**
 * What the period count of each KPI means. The headline is the current
 * count, while the period figure is a flow ("120 started in last 30 days"),
 * so a card can read "0 Drafts" next to "120 drafted" once every draft has
 * moved on.
 */
const KPI_PERIOD_VERB: Record<ClientKpi["key"], string> = {
  total: "new",
  posted: "posted",
  shared: "shared",
  inProgress: "started",
  drafts: "drafted",
};

export function KpiCard({ kpi, periodLabel }: { kpi: ClientKpi; periodLabel: string }) {
  const { icon: Icon, tile } = KPI_STYLE[kpi.key];
  const delta = kpi.periodValue - kpi.previousPeriodValue;
  const Trend = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const trendColor =
    delta > 0
      ? "text-emerald-600 dark:text-emerald-400"
      : delta < 0
        ? "text-red-600 dark:text-red-400"
        : "text-muted-foreground";
  const pct =
    kpi.changePct == null
      ? kpi.periodValue > 0 && kpi.previousPeriodValue === 0
        ? "New"
        : "—"
      : `${kpi.changePct > 0 ? "+" : ""}${kpi.changePct}%`;

  return (
    <div className="rounded-xl border border-border/80 bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <span className={cn("flex h-10 w-10 items-center justify-center rounded-lg", tile)}>
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <p className="mt-4 text-[28px] font-bold leading-none tabular-nums tracking-tight">{kpi.value}</p>
      <p className="mt-1.5 text-[15px] text-muted-foreground">{kpi.label}</p>
      <div className="mt-3 text-xs">
        <p className="flex items-center gap-1.5">
          <Trend className={cn("h-3.5 w-3.5 shrink-0", trendColor)} aria-hidden />
          <span className={cn("font-semibold", trendColor)}>{pct}</span>
          <span className="text-muted-foreground">vs previous period</span>
        </p>
        <p className="mt-1 text-muted-foreground">
          {kpi.periodValue} {KPI_PERIOD_VERB[kpi.key]} {periodLabel}
        </p>
      </div>
    </div>
  );
}

export function KpiRow({ kpis, periodLabel }: { kpis: ClientKpi[]; periodLabel: string }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {kpis.map((k) => (
        <KpiCard key={k.key} kpi={k} periodLabel={periodLabel} />
      ))}
    </div>
  );
}
