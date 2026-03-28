import Link from "next/link"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { TaskForm } from "@/components/task-form"

import { serverFetch } from "@/lib/server-fetch"

async function getClients() {
  try {
    const res = await serverFetch("/api/clients?limit=500")
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

async function getTeamMembers(): Promise<{ _id: string; name: string }[]> {
  try {
    const res = await serverFetch("/api/team/members?status=Active&limit=100")
    if (!res.ok) return []
    const data = await res.json()
    return (data.items ?? []) as { _id: string; name: string }[]
  } catch {
    return []
  }
}

export default async function NewTaskPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>
}) {
  const params = await searchParams
  const [clients, teamMembers] = await Promise.all([getClients(), getTeamMembers()])

  async function createTask(formData: FormData) {
    "use server"
    const clientId = formData.get("clientId") as string
    const title = (formData.get("title") as string)?.trim()
    if (!clientId || !title) throw new Error("Client and title are required")
    const assignedToUserId = (formData.get("assignedTo") as string)?.trim() || undefined
    const assignee = assignedToUserId ? teamMembers.find((m) => m._id === assignedToUserId) : null
    const res = await serverFetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        title,
        description: (formData.get("description") as string)?.trim() || undefined,
        assignedToUserId: assignedToUserId || undefined,
        assignedToName: assignee?.name || undefined,
        priority: (formData.get("priority") as string) || "MEDIUM",
        status: (formData.get("status") as string) || "TODO",
        deadline: (formData.get("deadline") as string) || undefined,
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || "Failed to add task")
    }
    redirect("/dashboard/tasks")
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/tasks">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Add task</h1>
            <p className="text-muted-foreground">
              Create a task and assign it to a client and optional team member.
            </p>
          </div>
        </div>

        <div className="max-w-2xl">
          <TaskForm
            clients={clients}
            users={teamMembers}
            action={createTask}
            defaultClientId={params.clientId}
          />
        </div>
      </div>
    </DashboardLayout>
  )
}
