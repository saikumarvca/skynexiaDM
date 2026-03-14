import Link from "next/link"

export const dynamic = "force-dynamic"
import { DashboardLayout } from "@/components/dashboard-layout"
import { StatsCard } from "@/components/stats-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Users,
  Target,
  TrendingUp,
  DollarSign,
  BarChart3,
  ClipboardList,
  ExternalLink,
} from "lucide-react"
import { Campaign } from "@/types"
import { Lead } from "@/types"

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

async function getStats() {
  try {
    const res = await fetch(`${BASE}/api/dashboard/stats`, { cache: "no-store" })
    if (!res.ok) throw new Error("Failed to fetch stats")
    return res.json()
  } catch (e) {
    console.error("Error fetching stats:", e)
    return {
      totalClients: 0,
      totalReviews: 0,
      unusedReviews: 0,
      usedReviews: 0,
      totalLeads: 0,
      totalCampaigns: 0,
      activeCampaigns: 0,
      openTasks: 0,
      scheduledToday: 0,
    }
  }
}

async function getCampaigns(): Promise<Campaign[]> {
  try {
    const res = await fetch(`${BASE}/api/campaigns`, { cache: "no-store" })
    if (!res.ok) return []
    return res.json()
  } catch (e) {
    console.error("Error fetching campaigns:", e)
    return []
  }
}

async function getLeads(): Promise<Lead[]> {
  try {
    const res = await fetch(`${BASE}/api/leads`, { cache: "no-store" })
    if (!res.ok) return []
    return res.json()
  } catch (e) {
    console.error("Error fetching leads:", e)
    return []
  }
}

export default async function DashboardAnalyticsPage() {
  const [stats, campaigns, leads] = await Promise.all([
    getStats(),
    getCampaigns(),
    getLeads(),
  ])

  const clientName = (c: Campaign) => {
    const id = typeof c.clientId === "object" ? c.clientId : null
    if (id && "businessName" in id) return (id as { businessName?: string }).businessName ?? (id as { name?: string }).name ?? "—"
    return "—"
  }
  const clientId = (c: Campaign) =>
    typeof c.clientId === "object" ? (c.clientId as { _id: string })._id : (c.clientId as string)

  const leadsByStatus = leads.reduce(
    (acc, l) => {
      acc[l.status] = (acc[l.status] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const closedWon = leadsByStatus["CLOSED_WON"] || 0
  const totalSpend = campaigns.reduce(
    (sum, c) => sum + (c.metrics?.costPerLead || 0) * (c.metrics?.leads || 0),
    0
  )
  const costPerLead =
    stats.totalLeads > 0 && totalSpend > 0
      ? (totalSpend / stats.totalLeads).toFixed(2)
      : "—"
  const conversionRate =
    stats.totalLeads > 0
      ? ((closedWon / stats.totalLeads) * 100).toFixed(1) + "%"
      : "—"

  const topCampaigns = [...campaigns]
    .filter((c) => (c.metrics?.leads || 0) > 0 || (c.metrics?.conversions || 0) > 0)
    .sort((a, b) => (b.metrics?.conversions || 0) - (a.metrics?.conversions || 0))
    .slice(0, 10)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground">
              Campaign ROI, leads, cost per lead, and conversion metrics.
            </p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Leads"
            value={stats.totalLeads}
            icon={Users}
            description="All leads in pipeline"
          />
          <StatsCard
            title="Active Campaigns"
            value={stats.activeCampaigns}
            icon={Target}
            description="Currently running"
          />
          <StatsCard
            title="Cost per Lead"
            value={costPerLead}
            icon={DollarSign}
            description="Avg across campaigns"
          />
          <StatsCard
            title="Conversion Rate"
            value={conversionRate}
            icon={TrendingUp}
            description="Closed won / total leads"
          />
          <StatsCard
            title="Total Campaigns"
            value={stats.totalCampaigns}
            icon={BarChart3}
            description="All campaigns"
          />
          <StatsCard
            title="Open Tasks"
            value={stats.openTasks}
            icon={ClipboardList}
            description="To do or in progress"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Leads by status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(leadsByStatus).length === 0 ? (
                <p className="text-sm text-muted-foreground">No leads yet.</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(leadsByStatus).map(([status, count]) => (
                    <div
                      key={status}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>{status.replace(/_/g, " ")}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Top campaigns
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topCampaigns.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No campaigns with leads or conversions yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {topCampaigns.map((c) => (
                    <div
                      key={c._id}
                      className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="font-medium text-sm">{c.campaignName}</p>
                        <p className="text-xs text-muted-foreground">
                          {clientName(c)} · {c.platform}
                        </p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="font-medium">
                          {c.metrics?.leads || 0} leads
                        </p>
                        <p className="text-muted-foreground">
                          {c.metrics?.conversions || 0} conv
                        </p>
                      </div>
                      <Link href={`/clients/${clientId(c)}`}>
                        <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Campaign performance</CardTitle>
          </CardHeader>
          <CardContent>
            {campaigns.length === 0 ? (
              <p className="text-sm text-muted-foreground">No campaigns yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 font-medium">Campaign</th>
                      <th className="pb-2 font-medium">Client</th>
                      <th className="pb-2 font-medium">Platform</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 font-medium">Leads</th>
                      <th className="pb-2 font-medium">Conversions</th>
                      <th className="pb-2 font-medium">CTR</th>
                      <th className="pb-2 font-medium">CPL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.slice(0, 15).map((c) => (
                      <tr key={c._id} className="border-b last:border-0">
                        <td className="py-2 font-medium">{c.campaignName}</td>
                        <td className="py-2">
                          <Link
                            href={`/clients/${clientId(c)}`}
                            className="text-primary hover:underline"
                          >
                            {clientName(c)}
                          </Link>
                        </td>
                        <td className="py-2">{c.platform}</td>
                        <td className="py-2">{c.status}</td>
                        <td className="py-2">{c.metrics?.leads ?? "—"}</td>
                        <td className="py-2">{c.metrics?.conversions ?? "—"}</td>
                        <td className="py-2">
                          {c.metrics?.ctr != null
                            ? `${c.metrics.ctr}%`
                            : "—"}
                        </td>
                        <td className="py-2">
                          {c.metrics?.costPerLead != null
                            ? `$${c.metrics.costPerLead}`
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="mt-4">
              <Link href="/dashboard/campaigns">
                <Button variant="outline" size="sm">
                  View all campaigns
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
