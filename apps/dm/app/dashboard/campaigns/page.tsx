import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import { Plus, Target, ExternalLink } from "lucide-react"
import { Campaign, CampaignStatus } from "@/types"
import { Client } from "@/types"
import dbConnect from "@/lib/mongodb"
import CampaignModel from "@/models/Campaign"
import ClientModel from "@/models/Client"

async function getCampaigns(filters: {
  clientId?: string
  platform?: string
  status?: string
}): Promise<Campaign[]> {
  try {
    await dbConnect()
    const query: Record<string, unknown> = {}
    if (filters.clientId) query.clientId = filters.clientId
    if (filters.platform) query.platform = filters.platform
    if (filters.status) query.status = filters.status
    const docs = await CampaignModel.find(query)
      .populate("clientId", "name businessName")
      .sort({ createdAt: -1 })
      .lean()
    return docs.map((c) => JSON.parse(JSON.stringify(c)))
  } catch (e) {
    console.error("Error fetching campaigns:", e)
    return []
  }
}

async function getClients(): Promise<Client[]> {
  try {
    await dbConnect()
    const docs = await ClientModel.find({}).sort({ createdAt: -1 }).limit(500).lean()
    return docs.map((c) => JSON.parse(JSON.stringify(c)))
  } catch (e) {
    console.error("Error fetching clients:", e)
    return []
  }
}

interface PageProps {
  searchParams: Promise<{ clientId?: string; platform?: string; status?: string }>
}

export default async function DashboardCampaignsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const [campaigns, clients] = await Promise.all([
    getCampaigns({
      clientId: params.clientId && params.clientId !== "ALL" ? params.clientId : undefined,
      platform: params.platform || undefined,
      status: params.status && params.status !== "ALL" ? params.status : undefined,
    }),
    getClients(),
  ])

  const clientName = (c: Campaign) => {
    const id = typeof c.clientId === "object" ? c.clientId : null
    if (id && "businessName" in id) return (id as { businessName?: string }).businessName ?? (id as { name?: string }).name ?? "—"
    return "—"
  }
  const clientId = (c: Campaign) =>
    typeof c.clientId === "object" ? (c.clientId as { _id: string })._id : (c.clientId as string)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
            <p className="text-muted-foreground">
              Plan, launch, and monitor your marketing campaigns.
            </p>
          </div>
          <Link href="/dashboard/campaigns/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New campaign
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <form method="get" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-muted-foreground">Client</label>
                <select
                  name="clientId"
                  defaultValue={params.clientId ?? "ALL"}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                >
                  <option value="ALL">All clients</option>
                  {clients.map((client) => (
                    <option key={client._id} value={client._id}>
                      {client.businessName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-muted-foreground">Platform</label>
                <Input
                  name="platform"
                  placeholder="e.g. Facebook, Google"
                  defaultValue={params.platform ?? ""}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-muted-foreground">Status</label>
                <select
                  name="status"
                  defaultValue={params.status ?? "ALL"}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                >
                  <option value="ALL">All statuses</option>
                  {(["PLANNED", "ACTIVE", "PAUSED", "COMPLETED", "CANCELLED"] as CampaignStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <Button type="submit" variant="secondary">
                  Apply
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5" />
              All campaigns ({campaigns.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {campaigns.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                <p>No campaigns match your filters.</p>
                <Link href="/dashboard/campaigns/new">
                  <Button className="mt-4" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Create your first campaign
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 font-medium">Campaign</th>
                      <th className="pb-3 font-medium">Client</th>
                      <th className="pb-3 font-medium">Platform</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Budget</th>
                      <th className="pb-3 font-medium">Dates</th>
                      <th className="pb-3 font-medium">Metrics</th>
                      <th className="pb-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((c) => (
                      <tr key={c._id} className="border-b last:border-0">
                        <td className="py-3 font-medium">{c.campaignName}</td>
                        <td className="py-3">
                          <Link
                            href={`/clients/${clientId(c)}`}
                            className="text-primary hover:underline"
                          >
                            {clientName(c)}
                          </Link>
                        </td>
                        <td className="py-3">{c.platform}</td>
                        <td className="py-3">
                          <StatusBadge status={c.status as CampaignStatus} />
                        </td>
                        <td className="py-3">
                          {c.budget != null ? `$${Number(c.budget).toLocaleString()}` : "—"}
                        </td>
                        <td className="py-3">
                          {c.startDate
                            ? new Date(c.startDate).toLocaleDateString()
                            : "—"}
                          {" → "}
                          {c.endDate
                            ? new Date(c.endDate).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="py-3">
                          {c.metrics && (
                            <span className="text-muted-foreground">
                              {c.metrics.impressions != null && `${(c.metrics.impressions / 1000).toFixed(1)}k imp`}
                              {c.metrics.clicks != null && ` · ${c.metrics.clicks} clk`}
                              {c.metrics.leads != null && ` · ${c.metrics.leads} leads`}
                              {!c.metrics?.impressions && !c.metrics?.clicks && !c.metrics?.leads && "—"}
                            </span>
                          )}
                        </td>
                        <td className="py-3">
                          <Link
                            href={`/clients/${clientId(c)}`}
                            className="text-muted-foreground hover:text-foreground"
                            title="Open client"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
