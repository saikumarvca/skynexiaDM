import Link from "next/link";
import { Suspense } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { QueryToast } from "@/components/query-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ClipboardList } from "lucide-react";
import { Task, TaskStatus, TaskPriority, Client } from "@/types";

import { getBaseUrl, serverFetch } from "@/lib/server-fetch";
import { TasksListClient } from "@/components/tasks/tasks-list-client";

async function getTasks(filters: {
  clientId?: string;
  status?: string;
  priority?: string;
  assignedTo?: string;
}): Promise<Task[]> {
  try {
    const url = new URL(`${getBaseUrl()}/api/tasks`);
    if (filters.clientId) url.searchParams.set("clientId", filters.clientId);
    if (filters.status) url.searchParams.set("status", filters.status);
    if (filters.priority) url.searchParams.set("priority", filters.priority);
    if (filters.assignedTo)
      url.searchParams.set("assignedTo", filters.assignedTo);
    const res = await serverFetch(url.pathname + url.search);
    if (!res.ok) throw new Error("Failed to fetch tasks");
    return await res.json();
  } catch (e) {
    console.error("Error fetching tasks:", e);
    return [];
  }
}

async function getClients(): Promise<Client[]> {
  try {
    const res = await serverFetch("/api/clients?limit=500");
    if (!res.ok) throw new Error("Failed to fetch clients");
    return await res.json();
  } catch (e) {
    console.error("Error fetching clients:", e);
    return [];
  }
}

const STATUSES: TaskStatus[] = [
  "TODO",
  "IN_PROGRESS",
  "BLOCKED",
  "DONE",
  "ARCHIVED",
];
const PRIORITIES: TaskPriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

interface PageProps {
  searchParams: Promise<{
    clientId?: string;
    status?: string;
    priority?: string;
  }>;
}

export default async function DashboardTasksPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const [tasks, clients] = await Promise.all([
    getTasks({
      clientId:
        params.clientId && params.clientId !== "ALL"
          ? params.clientId
          : undefined,
      status:
        params.status && params.status !== "ALL" ? params.status : undefined,
      priority:
        params.priority && params.priority !== "ALL"
          ? params.priority
          : undefined,
    }),
    getClients(),
  ]);

  return (
    <DashboardLayout>
      <Suspense fallback={null}>
        <QueryToast message="Task created" />
      </Suspense>
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
            <form
              method="get"
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            >
              <div>
                <label className="mb-1 block text-sm font-medium text-muted-foreground">
                  Client
                </label>
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
                <label className="mb-1 block text-sm font-medium text-muted-foreground">
                  Status
                </label>
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
                <label className="mb-1 block text-sm font-medium text-muted-foreground">
                  Priority
                </label>
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
            <TasksListClient tasks={tasks} clients={clients} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
