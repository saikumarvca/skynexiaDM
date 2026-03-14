import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Users, ExternalLink, Mail, Phone } from "lucide-react"
import { Lead, LeadStatus } from "@/types"
import { Client } from "@/types"

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

async function getLeads(filters: {
  clientId?: string
  status?: string
  source?: string
}): Promise<Lead[]> {
  try {
    const url = new URL(`${BASE}/api/leads`)
    if (filters.clientId) url.searchParams.set("clientId", filters.clientId)
    if (filters.status) url.searchParams.set("status", filters.status)
    if (filters.source) url.searchParams.set("source", filters.source)
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) throw new Error("Failed to fetch leads")
    return res.json()
  } catch (e) {
    console.error("Error fetching leads:", e)
    return []
  }
}

async function getClients(): Promise<Client[]> {
  try {
    const res = await fetch(`${BASE}/api/clients?limit=500`, { cache: "no-store" })
    if (!res.ok) throw new Error("Failed to fetch clients")
    return res.json()
  } catch (e) {
    console.error("Error fetching clients:", e)
    return []
  }
}

const STATUSES: LeadStatus[] = ["NEW", "CONTACTED", "QUALIFIED", "CLOSED_WON", "CLOSED_LOST"]

interface PageProps {
  searchParams: Promise<{ clientId?: string; status?: string; source?: string }>
}

export default async function DashboardLeadsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const [leads, clients] = await Promise.all([
    getLeads({
      clientId: params.clientId && params.clientId !== "ALL" ? params.clientId : undefined,
      status: params.status && params.status !== "ALL" ? params.status : undefined,
      source: params.source || undefined,
    }),
    getClients(),
  ])

  const clientName = (lead: Lead) => {
    const id = typeof lead.clientId === "object" ? lead.clientId : null
    if (id && "businessName" in id) return (id as { businessName?: string }).businessName ?? (id as { name?: string }).name ?? "—"
    return "—"
  }
  const clientId = (lead: Lead) =>
    typeof lead.clientId === "object" ? (lead.clientId as { _id: string })._id : (lead.clientId as string)
  const campaignName = (lead: Lead) => {
    if (!lead.campaignId) return "—"
    const c = lead.campaignId
    if (typeof c === "object" && c && "campaignName" in c) return (c as { campaignName?: string }).campaignName ?? "—"
    return "—"
  }

  const statusColor = (status: LeadStatus) => {
    switch (status) {
      case "NEW": return "bg-blue-100 text-blue-800"
      case "CONTACTED": return "bg-amber-100 text-amber-800"
      case "QUALIFIED": return "bg-green-100 text-green-800"
      case "CLOSED_WON": return "bg-emerald-100 text-emerald-800"
      case "CLOSED_LOST": return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
            <p className="text-muted-foreground">
              View and manage incoming leads from your campaigns.
            </p>
          </div>
          <Link href="/dashboard/leads/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add lead
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
                  {clients.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.businessName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-muted-foreground">Status</label>
                <select
                  name="status"
                  defaultValue={params.status ?? "ALL"}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                >
                  <option value="ALL">All</option>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-muted-foreground">Source</label>
                <Input
                  name="source"
                  placeholder="e.g. Google Ads"
                  defaultValue={params.source ?? ""}
                />
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
              <Users className="h-5 w-5" />
              Lead pipeline ({leads.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leads.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                <p>No leads match your filters.</p>
                <Link href="/dashboard/leads/new">
                  <Button className="mt-4" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Add your first lead
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 font-medium">Name</th>
                      <th className="pb-3 font-medium">Contact</th>
                      <th className="pb-3 font-medium">Client</th>
                      <th className="pb-3 font-medium">Source</th>
                      <th className="pb-3 font-medium">Campaign</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Created</th>
                      <th className="pb-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => (
                      <tr key={lead._id} className="border-b last:border-0">
                        <td className="py-3 font-medium">{lead.name}</td>
                        <td className="py-3">
                          <div className="flex flex-col gap-0.5">
                            {lead.email && (
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Mail className="h-3.5 w-3.5" />
                                {lead.email}
                              </span>
                            )}
                            {lead.phone && (
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Phone className="h-3.5 w-3.5" />
                                {lead.phone}
                              </span>
                            )}
                            {!lead.email && !lead.phone && "—"}
                          </div>
                        </td>
                        <td className="py-3">
                          <Link
                            href={`/clients/${clientId(lead)}`}
                            className="text-primary hover:underline"
                          >
                            {clientName(lead)}
                          </Link>
                        </td>
                        <td className="py-3">{lead.source ?? "—"}</td>
                        <td className="py-3">{campaignName(lead)}</td>
                        <td className="py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(lead.status)}`}
                          >
                            {lead.status}
                          </span>
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {new Date(lead.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3">
                          <Link
                            href={`/clients/${clientId(lead)}`}
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
