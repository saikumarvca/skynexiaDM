import Link from "next/link"
import { Suspense } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { QueryToast } from "@/components/query-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Target, Archive } from "lucide-react"
import { Campaign, CampaignStatus } from "@/types"
import { Client } from "@/types"
import dbConnect from "@/lib/mongodb"
import CampaignModel from "@/models/Campaign"
import ClientModel from "@/models/Client"
import { CampaignsListWithSheet } from "@/components/campaigns/campaigns-list-with-sheet"
import { ExportButton } from "@/components/export-button"
import { PdfExportButton } from "@/components/pdf-export-button"

async function getCampaigns(filters: {
  clientId?: string
  platform?: string
  status?: string
  archived?: boolean
}): Promise<Campaign[]> {
  try {
    await dbConnect()
    const query: Record<string, unknown> = {}
    if (filters.clientId) query.clientId = filters.clientId
    if (filters.platform) query.platform = filters.platform
    if (filters.status) {
      query.status = filters.status
    } else {
      // By default exclude ARCHIVED unless explicitly viewing archived
      query.status = filters.archived ? "ARCHIVED" : { $ne: "ARCHIVED" }
    }
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
  searchParams: Promise<{ clientId?: string; platform?: string; status?: string; archived?: string }>
}

export default async function DashboardCampaignsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const showArchived = params.archived === "1" || params.archived === "true"
  const [campaigns, clients] = await Promise.all([
    getCampaigns({
      clientId: params.clientId && params.clientId !== "ALL" ? params.clientId : undefined,
      platform: params.platform || undefined,
      status: params.status && params.status !== "ALL" ? params.status : undefined,
      archived: showArchived,
    }),
    getClients(),
  ])

  const exportBase = `/api/export/campaigns`
  const exportParams = new URLSearchParams()
  if (params.clientId && params.clientId !== "ALL") exportParams.set("clientId", params.clientId)
  if (params.status && params.status !== "ALL") exportParams.set("status", params.status)
  const exportQs = exportParams.toString() ? `?${exportParams.toString()}` : ""

  return (
    <DashboardLayout>
      <Suspense fallback={null}>
        <QueryToast message="Campaign created" />
      </Suspense>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {showArchived ? "Archived campaigns" : "Campaigns"}
            </h1>
            <p className="text-muted-foreground">
              {showArchived
                ? "Campaigns removed from the active list. Set status to re-activate."
                : "Plan, launch, and monitor your marketing campaigns."}
            </p>
            <div className="mt-3">
              <Link
                href={showArchived ? "/dashboard/campaigns" : "/dashboard/campaigns?archived=1"}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                <Archive className="h-3.5 w-3.5" />
                {showArchived ? "View active campaigns" : "View archived campaigns"}
              </Link>
            </div>
          </div>
          {!showArchived && (
            <div className="flex items-center gap-2">
              <ExportButton href={`${exportBase}${exportQs}`} />
              <PdfExportButton href={`${exportBase}/pdf${exportQs}`} />
              <Link href="/dashboard/campaigns/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New campaign
                </Button>
              </Link>
            </div>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <form method="get" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {showArchived && <input type="hidden" name="archived" value="1" />}
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
              {!showArchived && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-muted-foreground">Status</label>
                  <select
                    name="status"
                    defaultValue={params.status ?? "ALL"}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  >
                    <option value="ALL">All statuses</option>
                    {(["PLANNED", "ACTIVE", "PAUSED", "COMPLETED", "CANCELLED"] as CampaignStatus[]).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              )}
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
              {showArchived ? "Archived" : "All"} campaigns ({campaigns.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {campaigns.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                {showArchived ? (
                  <>
                    <Archive className="mx-auto mb-3 h-10 w-10 opacity-30" />
                    <p>No archived campaigns.</p>
                    <p className="mt-1 text-sm">Campaigns set to ARCHIVED status will appear here.</p>
                  </>
                ) : (
                  <>
                    <p>No campaigns match your filters.</p>
                    <Link href="/dashboard/campaigns/new">
                      <Button className="mt-4" variant="outline">
                        <Plus className="mr-2 h-4 w-4" />
                        Create your first campaign
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            ) : (
              <CampaignsListWithSheet campaigns={campaigns} clients={clients} />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
