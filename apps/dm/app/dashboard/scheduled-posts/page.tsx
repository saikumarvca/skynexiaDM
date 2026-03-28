import Link from "next/link"
import { Suspense } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { QueryToast } from "@/components/query-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, CalendarClock } from "lucide-react"
import { ScheduledPost } from "@/types"
import { serverFetch } from "@/lib/server-fetch"
import { Client } from "@/types"
import { DeleteScheduledPostButton } from "@/components/scheduled-posts/delete-scheduled-post-button"
import { format } from "date-fns"

async function getClients(): Promise<Client[]> {
  const res = await serverFetch("/api/clients?limit=500")
  if (!res.ok) return []
  return res.json()
}

async function getPosts(search: {
  clientId?: string
  platform?: string
  status?: string
}): Promise<ScheduledPost[]> {
  const q = new URLSearchParams()
  if (search.clientId && search.clientId !== "ALL") q.set("clientId", search.clientId)
  if (search.platform?.trim()) q.set("platform", search.platform.trim())
  if (search.status && search.status !== "ALL") q.set("status", search.status)
  const res = await serverFetch(`/api/scheduled-posts?${q.toString()}`)
  if (!res.ok) return []
  return res.json()
}

function clientLabel(p: ScheduledPost): string {
  const c = p.clientId
  if (c && typeof c === "object") {
    return (c as { businessName?: string; name?: string }).businessName ?? (c as { name?: string }).name ?? "—"
  }
  return "—"
}

interface PageProps {
  searchParams: Promise<{ clientId?: string; platform?: string; status?: string }>
}

export default async function ScheduledPostsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const [posts, clients] = await Promise.all([
    getPosts({
      clientId: params.clientId,
      platform: params.platform,
      status: params.status,
    }),
    getClients(),
  ])

  return (
    <DashboardLayout>
      <Suspense fallback={null}>
        <QueryToast message="Scheduled post created" />
      </Suspense>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Scheduled posts</h1>
            <p className="text-muted-foreground">Plan and track upcoming social content by client.</p>
          </div>
          <Link href="/dashboard/scheduled-posts/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New scheduled post
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
                <label className="mb-1 block text-sm font-medium text-muted-foreground">Platform</label>
                <Input name="platform" placeholder="e.g. Instagram" defaultValue={params.platform ?? ""} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-muted-foreground">Status</label>
                <select
                  name="status"
                  defaultValue={params.status ?? "ALL"}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                >
                  <option value="ALL">All</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="FAILED">Failed</option>
                  <option value="CANCELLED">Cancelled</option>
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
              <CalendarClock className="h-5 w-5" />
              Posts ({posts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {posts.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <p>No scheduled posts match your filters.</p>
                <Link href="/dashboard/scheduled-posts/new">
                  <Button className="mt-4" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Schedule a post
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-left">
                      <th className="p-3 font-medium">When</th>
                      <th className="p-3 font-medium">Client</th>
                      <th className="p-3 font-medium">Platform</th>
                      <th className="p-3 font-medium">Status</th>
                      <th className="p-3 font-medium">Preview</th>
                      <th className="w-24 p-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map((p) => {
                      const when = p.publishDate ? format(new Date(p.publishDate), "dd MMM yyyy, HH:mm") : "—"
                      const preview =
                        p.content.length > 80 ? `${p.content.slice(0, 80)}…` : p.content
                      return (
                        <tr key={p._id} className="border-b last:border-0">
                          <td className="p-3 whitespace-nowrap">{when}</td>
                          <td className="p-3">{clientLabel(p)}</td>
                          <td className="p-3">{p.platform}</td>
                          <td className="p-3">
                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">{p.status}</span>
                          </td>
                          <td className="max-w-xs p-3 text-muted-foreground">{preview}</td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/dashboard/scheduled-posts/${p._id}/edit`}>Edit</Link>
                              </Button>
                              <DeleteScheduledPostButton postId={p._id} />
                            </div>
                          </td>
                        </tr>
                      )
                    })}
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
