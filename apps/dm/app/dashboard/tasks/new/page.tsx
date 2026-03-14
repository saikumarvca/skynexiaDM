import Link from "next/link"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { TaskForm } from "@/components/task-form"

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

async function getClients() {
  try {
    const res = await fetch(`${BASE}/api/clients?limit=500`, { cache: "no-store" })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

async function getUsers() {
  try {
    const res = await fetch(`${BASE}/api/users`, { cache: "no-store" })
    if (!res.ok) return []
    return res.json()
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
  const [clients, users] = await Promise.all([getClients(), getUsers()])

  async function createTask(formData: FormData) {
    "use server"
    const clientId = formData.get("clientId") as string
    const title = (formData.get("title") as string)?.trim()
    if (!clientId || !title) throw new Error("Client and title are required")
    const assignedTo = formData.get("assignedTo") as string
    const res = await fetch(`${BASE}/api/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        title,
        description: (formData.get("description") as string)?.trim() || undefined,
        assignedTo: assignedTo && assignedTo !== "" ? assignedTo : null,
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
            users={users}
            action={createTask}
            defaultClientId={params.clientId}
          />
        </div>
      </div>
    </DashboardLayout>
  )
}
