import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { ScheduledPostForm } from "@/components/scheduled-post-form"
import { serverFetch } from "@/lib/server-fetch"
import { Client, ScheduledPost, ScheduledPostStatus } from "@/types"

async function getClients(): Promise<Client[]> {
  const res = await serverFetch("/api/clients?limit=500")
  if (!res.ok) return []
  return res.json()
}

async function getPost(postId: string): Promise<ScheduledPost | null> {
  const res = await serverFetch(`/api/scheduled-posts/${postId}`)
  if (!res.ok) return null
  return res.json()
}

function clientIdString(p: ScheduledPost): string {
  const c = p.clientId
  return typeof c === "object" && c && "_id" in c ? String((c as { _id: string })._id) : String(c)
}

function contentIdString(p: ScheduledPost): string | null {
  const x = p.contentId
  if (x == null) return null
  if (typeof x === "object" && "_id" in x) return String((x as { _id: string })._id)
  return String(x)
}

export default async function EditScheduledPostPage({
  params,
}: {
  params: Promise<{ postId: string }>
}) {
  const { postId } = await params
  const [post, clients] = await Promise.all([getPost(postId), getClients()])
  if (!post) notFound()

  async function updateScheduledPost(formData: FormData) {
    "use server"
    const clientId = formData.get("clientId") as string
    const platform = formData.get("platform") as string
    const content = formData.get("content") as string
    const publishLocal = formData.get("publishDate") as string
    if (!clientId || !platform || !content || !publishLocal) {
      throw new Error("Client, platform, content, and publish date are required")
    }
    const publishDate = new Date(publishLocal).toISOString()
    const timeZone = (formData.get("timeZone") as string)?.trim() || undefined
    const status = (formData.get("status") as string) || "SCHEDULED"
    const contentIdRaw = (formData.get("contentId") as string)?.trim()
    const contentId = contentIdRaw ? contentIdRaw : null

    const res = await serverFetch(`/api/scheduled-posts/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        platform,
        content,
        publishDate,
        timeZone,
        status,
        contentId,
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error((err as { error?: string }).error || "Failed to update scheduled post")
    }
    redirect("/dashboard/scheduled-posts")
  }

  const initial = {
    clientId: clientIdString(post),
    platform: post.platform,
    content: post.content,
    publishDateIso: post.publishDate,
    timeZone: post.timeZone,
    status: post.status as ScheduledPostStatus,
    contentId: contentIdString(post),
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/scheduled-posts">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit scheduled post</h1>
            <p className="text-muted-foreground">Update timing, platform, or copy.</p>
          </div>
        </div>

        <div className="max-w-2xl">
          <ScheduledPostForm
            clients={clients}
            action={updateScheduledPost}
            initial={initial}
            submitLabel="Save changes"
          />
        </div>
      </div>
    </DashboardLayout>
  )
}
