import { DashboardLayout } from "@/components/dashboard-layout"

export const dynamic = "force-dynamic"
import { StatsCard } from "@/components/stats-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, CheckCircle, Archive } from "lucide-react"
import Link from "next/link"
import { Client, DashboardStats } from "@/types"

async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const res = await fetch(`${process.env.API_URL || `http://localhost:${process.env.PORT || 3152}`}/api/dashboard/stats`, {
      cache: 'no-store'
    })
    if (!res.ok) throw new Error('Failed to fetch stats')
    return res.json()
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return {
      totalClients: 0,
      totalReviews: 0,
      unusedReviews: 0,
      usedReviews: 0,
    }
  }
}

async function getRecentClients(): Promise<Client[]> {
  try {
    const res = await fetch(`${process.env.API_URL || `http://localhost:${process.env.PORT || 3152}`}/api/clients?limit=5`, {
      cache: 'no-store'
    })
    if (!res.ok) throw new Error('Failed to fetch clients')
    return res.json() as Promise<Client[]>
  } catch (error) {
    console.error('Error fetching recent clients:', error)
    return []
  }
}

export default async function DashboardPage() {
  const stats = await getDashboardStats()
  const recentClients = await getRecentClients()

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
              {recentClients.length > 0 ? (
                <div className="space-y-4">
                  {recentClients.map((client: Client) => (
                    <div key={client._id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{client.name}</p>
                        <p className="text-sm text-muted-foreground">{client.businessName}</p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(client.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No clients yet.</p>
              )}
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
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}