import Link from "next/link"
import { Suspense } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { QueryToast } from "@/components/query-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Search, ExternalLink, TrendingUp } from "lucide-react"
import { Keyword } from "@/types"
import { Client } from "@/types"

import { getBaseUrl, serverFetch } from "@/lib/server-fetch"

async function getKeywords(filters: { clientId?: string; search?: string }): Promise<Keyword[]> {
  try {
    const url = new URL(`${getBaseUrl()}/api/keywords`)
    if (filters.clientId) url.searchParams.set("clientId", filters.clientId)
    if (filters.search) url.searchParams.set("search", filters.search)
    const res = await serverFetch(url.pathname + url.search)
    if (!res.ok) throw new Error("Failed to fetch keywords")
    return await res.json()
  } catch (e) {
    console.error("Error fetching keywords:", e)
    return []
  }
}

async function getClients(): Promise<Client[]> {
  try {
    const res = await serverFetch("/api/clients?limit=500")
    if (!res.ok) throw new Error("Failed to fetch clients")
    return await res.json()
  } catch (e) {
    console.error("Error fetching clients:", e)
    return []
  }
}

interface PageProps {
  searchParams: Promise<{ clientId?: string; search?: string }>
}

export default async function DashboardSeoPage({ searchParams }: PageProps) {
  const params = await searchParams
  const [keywords, clients] = await Promise.all([
    getKeywords({
      clientId: params.clientId && params.clientId !== "ALL" ? params.clientId : undefined,
      search: params.search || undefined,
    }),
    getClients(),
  ])

  const clientName = (k: Keyword) => {
    const id = typeof k.clientId === "object" ? k.clientId : null
    if (id && "businessName" in id) return (id as { businessName?: string }).businessName ?? (id as { name?: string }).name ?? "—"
    return "—"
  }
  const clientId = (k: Keyword) =>
    typeof k.clientId === "object" ? (k.clientId as { _id: string })._id : (k.clientId as string)

  return (
    <DashboardLayout>
      <Suspense fallback={null}>
        <QueryToast message="Keyword created" />
      </Suspense>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">SEO</h1>
            <p className="text-muted-foreground">
              Track keywords, difficulty, rankings, and search volume for your clients.
            </p>
          </div>
          <Link href="/dashboard/seo/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add keyword
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
                <label className="mb-1 block text-sm font-medium text-muted-foreground">Search keyword</label>
                <Input
                  name="search"
                  placeholder="Filter by keyword..."
                  defaultValue={params.search ?? ""}
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
              <Search className="h-5 w-5" />
              Keyword tracker ({keywords.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {keywords.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                <p>No keywords match your filters.</p>
                <Link href="/dashboard/seo/new">
                  <Button className="mt-4" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Add your first keyword
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 font-medium">Keyword</th>
                      <th className="pb-3 font-medium">Client</th>
                      <th className="pb-3 font-medium">Rank</th>
                      <th className="pb-3 font-medium">Search vol.</th>
                      <th className="pb-3 font-medium">Difficulty</th>
                      <th className="pb-3 font-medium">Target URL</th>
                      <th className="pb-3 font-medium">Last updated</th>
                      <th className="pb-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {keywords.map((k) => (
                      <tr key={k._id} className="border-b last:border-0">
                        <td className="py-3 font-medium">{k.keyword}</td>
                        <td className="py-3">
                          <Link
                            href={`/clients/${clientId(k)}`}
                            className="text-primary hover:underline"
                          >
                            {clientName(k)}
                          </Link>
                        </td>
                        <td className="py-3">
                          {k.rank != null ? (
                            <span className="inline-flex items-center gap-1">
                              <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                              {k.rank}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-3">
                          {k.searchVolume != null ? k.searchVolume.toLocaleString() : "—"}
                        </td>
                        <td className="py-3">
                          {k.difficulty != null ? (
                            <span
                              className={
                                k.difficulty >= 70
                                  ? "text-red-600"
                                  : k.difficulty >= 40
                                    ? "text-amber-600"
                                    : "text-green-600"
                              }
                            >
                              {k.difficulty}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="max-w-[180px] truncate py-3 text-muted-foreground" title={k.targetUrl}>
                          {k.targetUrl ?? "—"}
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {k.lastUpdated
                            ? new Date(k.lastUpdated).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="py-3">
                          <Link
                            href={`/clients/${clientId(k)}`}
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
