import { StatsCard } from "@/components/stats-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, CheckCircle, Archive } from "lucide-react"
import { DashboardRecentClients } from "@/components/dashboard-recent-clients"
import { ReviewBalanceBar } from "@/components/dashboard/review-balance-bar"
import { DashboardExplore } from "@/components/dashboard/dashboard-explore"
import type { DashboardPageData } from "@/types"

export type DashboardRecentClientRow = {
  _id: string
  name: string
  businessName: string
  createdAt: string
}

export function OverviewView({
  data,
  recentClients,
}: {
  data: DashboardPageData
  recentClients: DashboardRecentClientRow[]
}) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total clients"
          value={data.totalClients}
          icon={Users}
          description="Active client accounts"
          accent="primary"
          className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both"
        />
        <StatsCard
          title="Total reviews"
          value={data.totalReviews}
          icon={FileText}
          description="All reviews in the system"
          accent="sky"
          className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both [animation-delay:60ms]"
        />
        <StatsCard
          title="Unused reviews"
          value={data.unusedReviews}
          icon={CheckCircle}
          description="Ready to assign or publish"
          accent="emerald"
          className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both [animation-delay:120ms]"
        />
        <StatsCard
          title="Used reviews"
          value={data.usedReviews}
          icon={Archive}
          description="Already in the wild"
          accent="violet"
          className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both [animation-delay:180ms]"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <DashboardExplore />
        </div>
        <div className="space-y-6">
          <ReviewBalanceBar
            unused={data.unusedReviews}
            used={data.usedReviews}
            total={data.totalReviews}
          />
          <Card className="border-border/80 overflow-hidden">
            <CardHeader className="border-b border-border/60 bg-muted/30 pb-4">
              <CardTitle className="text-base">Latest clients</CardTitle>
              <p className="text-sm font-normal text-muted-foreground">Recently added to your roster</p>
            </CardHeader>
            <CardContent className="pt-5">
              <DashboardRecentClients clients={recentClients} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
