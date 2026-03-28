import Link from "next/link"
import { Suspense } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { QueryToast } from "@/components/query-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Search } from "lucide-react"
import { Keyword } from "@/types"
import { Client } from "@/types"
import { SeoKeywordsTable } from "@/components/seo/seo-keywords-table"

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
              <SeoKeywordsTable keywords={keywords} />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
