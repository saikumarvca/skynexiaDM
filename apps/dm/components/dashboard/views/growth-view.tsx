import Link from "next/link"
import { StatsCard } from "@/components/stats-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Target, TrendingUp, Users, ClipboardList, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DashboardPageData } from "@/types"

const FUNNEL_STAGES: { key: string; label: string; color: string }[] = [
  { key: "NEW", label: "New", color: "bg-sky-500/90 dark:bg-sky-500/80" },
  { key: "CONTACTED", label: "Contacted", color: "bg-cyan-500/90 dark:bg-cyan-500/80" },
  { key: "QUALIFIED", label: "Qualified", color: "bg-emerald-500/90 dark:bg-emerald-500/80" },
  { key: "CLOSED_WON", label: "Won", color: "bg-green-600/90 dark:bg-green-600/80" },
  { key: "CLOSED_LOST", label: "Lost", color: "bg-muted-foreground/50" },
]

export function GrowthView({ data }: { data: DashboardPageData }) {
  const total = Math.max(
    1,
    FUNNEL_STAGES.reduce((s, { key }) => s + (data.leadStatusBreakdown[key] ?? 0), 0)
  )

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total leads"
          value={data.totalLeads}
          icon={TrendingUp}
          description="All pipeline stages"
          accent="violet"
        />
        <StatsCard
          title="Campaigns"
          value={data.totalCampaigns}
          icon={Target}
          description={`${data.activeCampaigns} active`}
          accent="amber"
        />
        <StatsCard
          title="Clients"
          value={data.totalClients}
          icon={Users}
          description="Non-archived accounts"
          accent="primary"
        />
        <StatsCard
          title="Open tasks"
          value={data.openTasks}
          icon={ClipboardList}
          description="Team workload signal"
          accent="sky"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border/80 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Lead funnel</CardTitle>
            <CardDescription>Share of leads by status (counts)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex h-4 overflow-hidden rounded-full bg-muted">
              {FUNNEL_STAGES.map(({ key, color }) => {
                const n = data.leadStatusBreakdown[key] ?? 0
                if (n <= 0) return null
                const pct = (n / total) * 100
                return (
                  <div
                    key={key}
                    className={cn(color, "min-w-0 transition-all duration-500")}
                    style={{ width: `${pct}%` }}
                    title={`${key}: ${n}`}
                  />
                )
              })}
            </div>
            <ul className="grid gap-2 sm:grid-cols-2">
              {FUNNEL_STAGES.map(({ key, label, color }) => {
                const n = data.leadStatusBreakdown[key] ?? 0
                return (
                  <li
                    key={key}
                    className="flex items-center justify-between rounded-md border border-border/60 bg-card px-3 py-2 text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <span className={cn("h-2 w-2 rounded-full", color)} />
                      {label}
                    </span>
                    <span className="font-mono tabular-nums text-muted-foreground">{n}</span>
                  </li>
                )
              })}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-border/80 h-fit">
          <CardHeader>
            <CardTitle className="text-base">Go deeper</CardTitle>
            <CardDescription>Full charts and campaign tables</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" asChild>
              <Link href="/dashboard/analytics">
                Open analytics <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/dashboard/leads">Leads list</Link>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/dashboard/campaigns">Campaigns</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
