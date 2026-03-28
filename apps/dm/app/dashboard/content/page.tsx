import Link from "next/link"
import { Suspense } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { QueryToast } from "@/components/query-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Layers, ExternalLink } from "lucide-react"
import { ContentItem, ContentCategory, ContentItemStatus } from "@/types"
import { Client } from "@/types"

import { getBaseUrl, serverFetch } from "@/lib/server-fetch"

async function getContentItems(filters: {
  clientId?: string
  platform?: string
  category?: string
  status?: string
  search?: string
}): Promise<ContentItem[]> {
  try {
    const url = new URL(`${getBaseUrl()}/api/content-bank`)
    if (filters.clientId) url.searchParams.set("clientId", filters.clientId)
    if (filters.platform) url.searchParams.set("platform", filters.platform)
    if (filters.category) url.searchParams.set("category", filters.category)
    if (filters.status) url.searchParams.set("status", filters.status)
    if (filters.search) url.searchParams.set("search", filters.search)
    const res = await serverFetch(url.pathname + url.search)
    if (!res.ok) throw new Error("Failed to fetch content")
    return await res.json()
  } catch (e) {
    console.error("Error fetching content:", e)
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

const CATEGORIES: ContentCategory[] = ["CAPTION", "HASHTAGS", "AD_COPY", "CTA", "HOOK", "OTHER"]
const STATUSES: ContentItemStatus[] = ["DRAFT", "APPROVED", "ARCHIVED"]

interface PageProps {
  searchParams: Promise<{
    clientId?: string
    platform?: string
    category?: string
    status?: string
    search?: string
  }>
}

export default async function DashboardContentPage({ searchParams }: PageProps) {
  const params = await searchParams
  const [items, clients] = await Promise.all([
    getContentItems({
      clientId: params.clientId && params.clientId !== "ALL" ? params.clientId : undefined,
      platform: params.platform || undefined,
      category: params.category && params.category !== "ALL" ? params.category : undefined,
      status: params.status && params.status !== "ALL" ? params.status : undefined,
      search: params.search || undefined,
    }),
    getClients(),
  ])

  const clientName = (item: ContentItem) => {
    const id = typeof item.clientId === "object" ? item.clientId : null
    if (id && "businessName" in id) return (id as { businessName?: string }).businessName ?? (id as { name?: string }).name ?? "—"
    return "—"
  }
  const clientId = (item: ContentItem) =>
    typeof item.clientId === "object" ? (item.clientId as { _id: string })._id : (item.clientId as string)

  return (
    <DashboardLayout>
      <Suspense fallback={null}>
        <QueryToast message="Content created" />
      </Suspense>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Content</h1>
            <p className="text-muted-foreground">
              Create and organize content assets: captions, hashtags, ad copy, CTAs, hooks.
            </p>
          </div>
          <Link href="/dashboard/content/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New content
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <form method="get" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
                <label className="mb-1 block text-sm font-medium text-muted-foreground">Category</label>
                <select
                  name="category"
                  defaultValue={params.category ?? "ALL"}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                >
                  <option value="ALL">All</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
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
                <label className="mb-1 block text-sm font-medium text-muted-foreground">Platform</label>
                <Input
                  name="platform"
                  placeholder="e.g. Instagram"
                  defaultValue={params.platform ?? ""}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-muted-foreground">Search</label>
                <Input
                  name="search"
                  placeholder="Title, content, tags..."
                  defaultValue={params.search ?? ""}
                />
              </div>
              <div className="flex items-end sm:col-span-2 lg:col-span-5">
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
              <Layers className="h-5 w-5" />
              Content bank ({items.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                <p>No content matches your filters.</p>
                <Link href="/dashboard/content/new">
                  <Button className="mt-4" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Add your first content
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 font-medium">Title</th>
                      <th className="pb-3 font-medium">Client</th>
                      <th className="pb-3 font-medium">Category</th>
                      <th className="pb-3 font-medium">Platform</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Preview</th>
                      <th className="pb-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item._id} className="border-b last:border-0">
                        <td className="py-3 font-medium">{item.title}</td>
                        <td className="py-3">
                          <Link
                            href={`/clients/${clientId(item)}`}
                            className="text-primary hover:underline"
                          >
                            {clientName(item)}
                          </Link>
                        </td>
                        <td className="py-3">{item.category}</td>
                        <td className="py-3">{item.platform ?? "—"}</td>
                        <td className="py-3">
                          <span
                            className={
                              item.status === "APPROVED"
                                ? "text-green-600"
                                : item.status === "ARCHIVED"
                                  ? "text-gray-500"
                                  : "text-amber-600"
                            }
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="max-w-[200px] truncate py-3 text-muted-foreground">
                          {item.content}
                        </td>
                        <td className="py-3">
                          <Link
                            href={`/clients/${clientId(item)}`}
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
