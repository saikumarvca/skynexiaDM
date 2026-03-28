import Link from "next/link"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { ScheduledPostForm } from "@/components/scheduled-post-form"
import { serverFetch } from "@/lib/server-fetch"
import { Client } from "@/types"

async function getClients(): Promise<Client[]> {
  const res = await serverFetch("/api/clients?limit=500")
  if (!res.ok) return []
  return res.json()
}

export default async function NewScheduledPostPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>
}) {
  const params = await searchParams
  const clients = await getClients()

  async function createScheduledPost(formData: FormData) {
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

    const res = await serverFetch("/api/scheduled-posts", {
      method: "POST",
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
      throw new Error((err as { error?: string }).error || "Failed to create scheduled post")
    }
    redirect("/dashboard/scheduled-posts?created=1")
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
            <h1 className="text-3xl font-bold tracking-tight">New scheduled post</h1>
            <p className="text-muted-foreground">Schedule copy for a specific time and platform.</p>
          </div>
        </div>

        <div className="max-w-2xl">
          <ScheduledPostForm
            clients={clients}
            action={createScheduledPost}
            defaultClientId={params.clientId}
            submitLabel="Schedule post"
          />
        </div>
      </div>
    </DashboardLayout>
  )
}
