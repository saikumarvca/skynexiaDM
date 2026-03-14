import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, ClipboardList, ExternalLink, Calendar, User } from "lucide-react"
import { Task, TaskStatus, TaskPriority } from "@/types"
import { Client } from "@/types"

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

async function getTasks(filters: {
  clientId?: string
  status?: string
  priority?: string
  assignedTo?: string
}): Promise<Task[]> {
  try {
    const url = new URL(`${BASE}/api/tasks`)
    if (filters.clientId) url.searchParams.set("clientId", filters.clientId)
    if (filters.status) url.searchParams.set("status", filters.status)
    if (filters.priority) url.searchParams.set("priority", filters.priority)
    if (filters.assignedTo) url.searchParams.set("assignedTo", filters.assignedTo)
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) throw new Error("Failed to fetch tasks")
    return res.json()
  } catch (e) {
    console.error("Error fetching tasks:", e)
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

const STATUSES: TaskStatus[] = ["TODO", "IN_PROGRESS", "BLOCKED", "DONE"]
const PRIORITIES: TaskPriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]

interface PageProps {
  searchParams: Promise<{ clientId?: string; status?: string; priority?: string }>
}

export default async function DashboardTasksPage({ searchParams }: PageProps) {
  const params = await searchParams
  const [tasks, clients] = await Promise.all([
    getTasks({
      clientId: params.clientId && params.clientId !== "ALL" ? params.clientId : undefined,
      status: params.status && params.status !== "ALL" ? params.status : undefined,
      priority: params.priority && params.priority !== "ALL" ? params.priority : undefined,
    }),
    getClients(),
  ])

  const clientName = (task: Task) => {
    const id = typeof task.clientId === "object" ? task.clientId : null
    if (id && "businessName" in id) return (id as { businessName?: string }).businessName ?? (id as { name?: string }).name ?? "—"
    return "—"
  }
  const clientId = (task: Task) =>
    typeof task.clientId === "object" ? (task.clientId as { _id: string })._id : (task.clientId as string)
  const assigneeName = (task: Task & { assignedToName?: string }) => {
    if (task.assignedToName) return task.assignedToName
    if (!task.assignedTo) return "—"
    const a = task.assignedTo
    if (typeof a === "object" && a && "name" in a) return (a as { name?: string }).name ?? (a as { email?: string }).email ?? "—"
    return "—"
  }

  const statusColor = (status: TaskStatus) => {
    switch (status) {
      case "TODO": return "bg-slate-100 text-slate-800"
      case "IN_PROGRESS": return "bg-blue-100 text-blue-800"
      case "BLOCKED": return "bg-red-100 text-red-800"
      case "DONE": return "bg-green-100 text-green-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }
  const priorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case "CRITICAL": return "text-red-600 font-medium"
      case "HIGH": return "text-amber-600"
      case "MEDIUM": return "text-slate-600"
      case "LOW": return "text-muted-foreground"
      default: return ""
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
            <p className="text-muted-foreground">
              Track and manage tasks for clients, campaigns, and reviews.
            </p>
          </div>
          <Link href="/dashboard/tasks/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add task
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
                      {s.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-muted-foreground">Priority</label>
                <select
                  name="priority"
                  defaultValue={params.priority ?? "ALL"}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                >
                  <option value="ALL">All</option>
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
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
              <ClipboardList className="h-5 w-5" />
              Task list ({tasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                <p>No tasks match your filters.</p>
                <Link href="/dashboard/tasks/new">
                  <Button className="mt-4" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Add your first task
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 font-medium">Task</th>
                      <th className="pb-3 font-medium">Client</th>
                      <th className="pb-3 font-medium">Assigned to</th>
                      <th className="pb-3 font-medium">Priority</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Deadline</th>
                      <th className="pb-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => (
                      <tr key={task._id} className="border-b last:border-0">
                        <td className="py-3">
                          <div>
                            <span className="font-medium">{task.title}</span>
                            {task.description && (
                              <p className="mt-0.5 max-w-[200px] truncate text-muted-foreground">
                                {task.description}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3">
                          <Link
                            href={`/clients/${clientId(task)}`}
                            className="text-primary hover:underline"
                          >
                            {clientName(task)}
                          </Link>
                        </td>
                        <td className="py-3">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <User className="h-3.5 w-3.5" />
                            {assigneeName(task)}
                          </span>
                        </td>
                        <td className={`py-3 ${priorityColor(task.priority)}`}>
                          {task.priority}
                        </td>
                        <td className="py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(task.status)}`}
                          >
                            {task.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {task.deadline ? (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {new Date(task.deadline).toLocaleDateString()}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-3">
                          <Link
                            href={`/clients/${clientId(task)}`}
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
