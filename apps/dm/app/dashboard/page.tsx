import { DashboardLayout } from "@/components/dashboard-layout"
import { StatsCard } from "@/components/stats-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, CheckCircle, Archive } from "lucide-react"
import { DashboardRecentClients } from "@/components/dashboard-recent-clients"
import { DashboardHero } from "@/components/dashboard/dashboard-hero"
import { ReviewBalanceBar } from "@/components/dashboard/review-balance-bar"
import { DashboardExplore } from "@/components/dashboard/dashboard-explore"
import { Client, DashboardStats } from "@/types"
import dbConnect from "@/lib/mongodb"
import ClientModel from "@/models/Client"
import Review from "@/models/Review"
import { getCachedUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

async function getDashboardStats(): Promise<DashboardStats> {
  await dbConnect()
  const [totalClients, totalReviews, unusedReviews, usedReviews] = await Promise.all([
    ClientModel.countDocuments({ status: { $ne: "ARCHIVED" } }),
    Review.countDocuments({ status: { $ne: "ARCHIVED" } }),
    Review.countDocuments({ status: "UNUSED" }),
    Review.countDocuments({ status: "USED" }),
  ])
  return { totalClients, totalReviews, unusedReviews, usedReviews }
}

async function getRecentClients(): Promise<Client[]> {
  await dbConnect()
  return ClientModel.find({ status: { $ne: "ARCHIVED" } })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean() as unknown as Client[]
}

export default async function DashboardPage() {
  const [user, stats, recentClients] = await Promise.all([
    getCachedUser(),
    getDashboardStats(),
    getRecentClients(),
  ])

  const recentForUi = recentClients.map((c) => ({
    _id: String(c._id),
    name: c.name,
    businessName: c.businessName,
    createdAt: typeof c.createdAt === "string" ? c.createdAt : new Date(c.createdAt).toISOString(),
  }))

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <DashboardHero userName={user.name} />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total clients"
            value={stats.totalClients}
            icon={Users}
            description="Active client accounts"
            accent="primary"
            className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both"
          />
          <StatsCard
            title="Total reviews"
            value={stats.totalReviews}
            icon={FileText}
            description="All reviews in the system"
            accent="sky"
            className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both [animation-delay:60ms]"
          />
          <StatsCard
            title="Unused reviews"
            value={stats.unusedReviews}
            icon={CheckCircle}
            description="Ready to assign or publish"
            accent="emerald"
            className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both [animation-delay:120ms]"
          />
          <StatsCard
            title="Used reviews"
            value={stats.usedReviews}
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
              unused={stats.unusedReviews}
              used={stats.usedReviews}
              total={stats.totalReviews}
            />
            <Card className="border-border/80 overflow-hidden">
              <CardHeader className="border-b border-border/60 bg-muted/30 pb-4">
                <CardTitle className="text-base">Latest clients</CardTitle>
                <p className="text-sm font-normal text-muted-foreground">Recently added to your roster</p>
              </CardHeader>
              <CardContent className="pt-5">
                <DashboardRecentClients clients={recentForUi} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
