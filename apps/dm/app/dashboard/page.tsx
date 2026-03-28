import { DashboardLayout } from "@/components/dashboard-layout"

export const dynamic = "force-dynamic"
import { StatsCard } from "@/components/stats-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, CheckCircle, Archive } from "lucide-react"
import { DashboardRecentClients } from "@/components/dashboard-recent-clients"
import Link from "next/link"
import { Client, DashboardStats } from "@/types"
import dbConnect from "@/lib/mongodb"
import ClientModel from "@/models/Client"
import Review from "@/models/Review"

async function getDashboardStats(): Promise<DashboardStats> {
  await dbConnect()
  const [totalClients, totalReviews, unusedReviews, usedReviews] = await Promise.all([
    ClientModel.countDocuments({ status: { $ne: 'ARCHIVED' } }),
    Review.countDocuments({ status: { $ne: 'ARCHIVED' } }),
    Review.countDocuments({ status: 'UNUSED' }),
    Review.countDocuments({ status: 'USED' }),
  ])
  return { totalClients, totalReviews, unusedReviews, usedReviews }
}

async function getRecentClients(): Promise<Client[]> {
  await dbConnect()
  return ClientModel.find({ status: { $ne: 'ARCHIVED' } })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean() as unknown as Client[]
}

export default async function DashboardPage() {
  const stats = await getDashboardStats()
  const recentClients = await getRecentClients()
  const recentForUi = recentClients.map((c) => ({
    _id: String(c._id),
    name: c.name,
    businessName: c.businessName,
    createdAt: typeof c.createdAt === "string" ? c.createdAt : new Date(c.createdAt).toISOString(),
  }))

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your digital marketing review management system.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Clients"
            value={stats.totalClients}
            icon={Users}
            description="Active client accounts"
          />
          <StatsCard
            title="Total Reviews"
            value={stats.totalReviews}
            icon={FileText}
            description="All reviews in system"
          />
          <StatsCard
            title="Unused Reviews"
            value={stats.unusedReviews}
            icon={CheckCircle}
            description="Available for use"
          />
          <StatsCard
            title="Used Reviews"
            value={stats.usedReviews}
            icon={Archive}
            description="Already utilized"
          />
        </div>

        {/* Recent Activity */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <DashboardRecentClients clients={recentForUi} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Link
                  href="/clients/new"
                  className="block w-full rounded-md bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Add New Client
                </Link>
                <Link
                  href="/clients"
                  className="block w-full rounded-md border px-4 py-2 text-center text-sm hover:bg-accent"
                >
                  View All Clients
                </Link>
                <Link
                  href="/clients?archived=1"
                  className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-muted-foreground/40 px-4 py-2 text-center text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <Archive className="h-4 w-4" />
                  Archived clients
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}