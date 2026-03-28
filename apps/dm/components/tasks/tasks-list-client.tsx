"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Task, TaskStatus, TaskPriority, Client } from "@/types"
import { Button } from "@/components/ui/button"
import { Archive, Calendar, User, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { SavedFiltersBar } from "@/components/saved-filters/saved-filters-bar"

const TASK_STATUSES: TaskStatus[] = ["TODO", "IN_PROGRESS", "BLOCKED", "DONE", "ARCHIVED"]
const TASK_PRIORITIES: TaskPriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]

function clientName(task: Task): string {
  const c = task.clientId
  if (c && typeof c === "object") {
    return (
      (c as { businessName?: string }).businessName ??
      (c as { name?: string }).name ??
      "—"
    )
  }
  return "—"
}

function clientId(task: Task): string {
  return typeof task.clientId === "object"
    ? (task.clientId as { _id: string })._id
    : (task.clientId as string)
}

function assigneeName(task: Task & { assignedToName?: string }): string {
  if ((task as { assignedToName?: string }).assignedToName) {
    return (task as { assignedToName?: string }).assignedToName!
  }
  if (!task.assignedTo) return "—"
  const a = task.assignedTo
  if (typeof a === "object" && a && "name" in a) {
    return (a as { name?: string }).name ?? (a as { email?: string }).email ?? "—"
  }
  return "—"
}

function statusBadgeClass(status: TaskStatus): string {
  switch (status) {
    case "TODO":
      return "bg-slate-100 text-slate-800"
    case "IN_PROGRESS":
      return "bg-blue-100 text-blue-800"
    case "BLOCKED":
      return "bg-red-100 text-red-800"
    case "DONE":
      return "bg-green-100 text-green-800"
    case "ARCHIVED":
      return "bg-gray-200 text-gray-500"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

function priorityClass(priority: TaskPriority): string {
  switch (priority) {
    case "CRITICAL":
      return "text-red-600 font-semibold"
    case "HIGH":
      return "text-amber-600"
    case "MEDIUM":
      return "text-slate-600"
    case "LOW":
      return "text-muted-foreground"
    default:
      return ""
  }
}

interface TasksListClientProps {
  tasks: Task[]
  clients: Client[]
}

export function TasksListClient({ tasks }: TasksListClientProps) {
  const router = useRouter()

  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())
  const [bulkStatus, setBulkStatus] = useState<TaskStatus | "">("")
  const [bulkWorking, setBulkWorking] = useState(false)
  const [showArchived, setShowArchived] = useState(false)

  // Inline status editing
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const visibleTasks = showArchived
    ? tasks
    : tasks.filter((t) => t.status !== "ARCHIVED")

  const allChecked = visibleTasks.length > 0 && checkedIds.size === visibleTasks.length
  const someChecked = checkedIds.size > 0 && !allChecked

  function toggleAll() {
    if (allChecked) {
      setCheckedIds(new Set())
    } else {
      setCheckedIds(new Set(visibleTasks.map((t) => t._id)))
    }
  }

  function toggleOne(id: string) {
    setCheckedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function updateTaskStatus(taskId: string, status: TaskStatus) {
    setUpdatingId(taskId)
    setEditingStatusId(null)
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(typeof err.error === "string" ? err.error : "Failed to update task")
        return
      }
      toast.success("Task status updated")
      router.refresh()
    } catch {
      toast.error("Failed to update task")
    } finally {
      setUpdatingId(null)
    }
  }

  async function archiveTask(taskId: string) {
    if (!window.confirm("Archive this task?")) return
    setUpdatingId(taskId)
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "ARCHIVED" }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(typeof err.error === "string" ? err.error : "Failed to archive task")
        return
      }
      toast.success("Task archived")
      setCheckedIds((prev) => {
        const next = new Set(prev)
        next.delete(taskId)
        return next
      })
      router.refresh()
    } catch {
      toast.error("Failed to archive task")
    } finally {
      setUpdatingId(null)
    }
  }

  async function unarchiveTask(taskId: string) {
    setUpdatingId(taskId)
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "TODO" }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(typeof err.error === "string" ? err.error : "Failed to unarchive task")
        return
      }
      toast.success("Task unarchived")
      router.refresh()
    } catch {
      toast.error("Failed to unarchive task")
    } finally {
      setUpdatingId(null)
    }
  }

  async function bulkArchive() {
    if (
      !window.confirm(
        `Archive ${checkedIds.size} task${checkedIds.size > 1 ? "s" : ""}?`
      )
    )
      return
    setBulkWorking(true)
    try {
      const res = await fetch("/api/tasks/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "archive", ids: Array.from(checkedIds) }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(typeof err.error === "string" ? err.error : "Bulk archive failed")
        return
      }
      const data = await res.json()
      toast.success(`Archived ${data.archived} task${data.archived !== 1 ? "s" : ""}`)
      setCheckedIds(new Set())
      router.refresh()
    } catch {
      toast.error("Bulk archive failed")
    } finally {
      setBulkWorking(false)
    }
  }

  async function bulkUpdateStatus() {
    if (!bulkStatus) {
      toast.error("Please select a status")
      return
    }
    setBulkWorking(true)
    try {
      const res = await fetch("/api/tasks/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "update-status",
          ids: Array.from(checkedIds),
          status: bulkStatus,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(typeof err.error === "string" ? err.error : "Bulk update failed")
        return
      }
      const data = await res.json()
      toast.success(`Updated ${data.updated} task${data.updated !== 1 ? "s" : ""}`)
      setCheckedIds(new Set())
      setBulkStatus("")
      router.refresh()
    } catch {
      toast.error("Bulk update failed")
    } finally {
      setBulkWorking(false)
    }
  }

  return (
    <>
      {/* Show archived toggle */}
      <div className="mb-3 flex items-center gap-2">
        <input
          id="show-archived-tasks"
          type="checkbox"
          checked={showArchived}
          onChange={(e) => setShowArchived(e.target.checked)}
          className="h-4 w-4 cursor-pointer rounded border-input"
        />
        <label htmlFor="show-archived-tasks" className="text-sm text-muted-foreground cursor-pointer select-none">
          Show archived tasks
        </label>
      </div>

      {/* Bulk action bar */}
      {checkedIds.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-md border bg-muted/50 px-4 py-2.5">
          <span className="text-sm font-medium text-foreground">
            {checkedIds.size} selected
          </span>
          <div className="flex items-center gap-2">
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value as TaskStatus | "")}
              className="h-8 rounded-md border border-input bg-background px-2 text-sm"
              disabled={bulkWorking}
            >
              <option value="">Update status…</option>
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              variant="secondary"
              disabled={!bulkStatus || bulkWorking}
              onClick={bulkUpdateStatus}
            >
              Apply
            </Button>
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={bulkWorking}
            onClick={bulkArchive}
          >
            <Archive className="mr-1.5 h-3.5 w-3.5" />
            Archive selected
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={bulkWorking}
            onClick={() => setCheckedIds(new Set())}
          >
            Clear
          </Button>
        </div>
      )}

      {visibleTasks.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          <p>No tasks match your filters.</p>
          <Link href="/dashboard/tasks/new">
            <Button className="mt-4" variant="outline">
              Add your first task
            </Button>
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 w-10 pl-2">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    ref={(el) => {
                      if (el) el.indeterminate = someChecked
                    }}
                    onChange={toggleAll}
                    aria-label="Select all tasks"
                    className="h-4 w-4 cursor-pointer rounded border-input"
                  />
                </th>
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
              {visibleTasks.map((task) => (
                <tr
                  key={task._id}
                  className={cn(
                    "border-b last:border-0",
                    checkedIds.has(task._id) && "bg-primary/5"
                  )}
                >
                  <td
                    className="py-3 pl-2"
                    onClick={() => toggleOne(task._id)}
                  >
                    <input
                      type="checkbox"
                      checked={checkedIds.has(task._id)}
                      onChange={() => toggleOne(task._id)}
                      aria-label={`Select ${task.title}`}
                      className="h-4 w-4 cursor-pointer rounded border-input"
                    />
                  </td>
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
                  <td className={cn("py-3", priorityClass(task.priority))}>
                    {task.priority}
                  </td>
                  <td className="py-3">
                    {/* Inline status change */}
                    <div className="relative">
                      <button
                        onClick={() =>
                          setEditingStatusId(
                            editingStatusId === task._id ? null : task._id
                          )
                        }
                        disabled={updatingId === task._id}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-50",
                          statusBadgeClass(task.status)
                        )}
                      >
                        {task.status.replace("_", " ")}
                        <ChevronDown className="h-3 w-3" />
                      </button>
                      {editingStatusId === task._id && (
                        <div className="absolute left-0 top-full z-10 mt-1 w-36 rounded-md border bg-popover shadow-md">
                          {TASK_STATUSES.map((s) => (
                            <button
                              key={s}
                              onClick={() => updateTaskStatus(task._id, s)}
                              className={cn(
                                "block w-full px-3 py-1.5 text-left text-xs hover:bg-muted",
                                task.status === s && "font-semibold"
                              )}
                            >
                              {s.replace("_", " ")}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
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
                    {task.status === "ARCHIVED" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-muted-foreground hover:text-foreground"
                        disabled={updatingId === task._id}
                        onClick={() => unarchiveTask(task._id)}
                        aria-label="Unarchive task"
                      >
                        Unarchive
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:bg-muted hover:text-foreground"
                        disabled={updatingId === task._id}
                        onClick={() => archiveTask(task._id)}
                        aria-label="Archive task"
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
