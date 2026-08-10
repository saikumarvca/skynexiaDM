import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SeedButton } from "@/components/seed-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";
import dbConnect from "@/lib/mongodb";
import TeamAssignment from "@/models/TeamAssignment";
import TeamMember from "@/models/TeamMember";

export const dynamic = "force-dynamic";

const TYPES = ["review", "lead", "task", "campaign", "client", "other"];
const STATUSES = ["Pending", "In Progress", "Completed", "Cancelled"];
const PRIORITIES = ["Low", "Medium", "High", "Urgent"];

interface PageProps {
  searchParams: Promise<{
    assignedTo?: string;
    type?: string;
    status?: string;
    priority?: string;
    page?: string;
  }>;
}

export default async function TeamAssignmentsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1"));
  const limit = 20;
  await dbConnect();

  const query: Record<string, unknown> = { isDeleted: { $ne: true } };
  if (params.assignedTo) query.assignedToUserId = params.assignedTo;
  if (params.type && params.type !== "ALL") query.assignmentType = params.type;
  if (params.status && params.status !== "ALL") query.status = params.status;
  if (params.priority && params.priority !== "ALL")
    query.priority = params.priority;

  const [items, total, memberDocs] = await Promise.all([
    TeamAssignment.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    TeamAssignment.countDocuments(query),
    TeamMember.find({ isDeleted: { $ne: true } })
      .select("name")
      .limit(100)
      .lean(),
  ]);
  const assignments = items.map((a) => JSON.parse(JSON.stringify(a)));
  const members = memberDocs.map((m) => JSON.parse(JSON.stringify(m)));
  const totalPages = Math.ceil(total / limit);

  const statusColor = (s: string) => {
    if (s === "Completed") return "bg-green-100 text-green-800";
    if (s === "Cancelled") return "bg-gray-100 text-gray-800";
    if (s === "In Progress") return "bg-blue-100 text-blue-800";
    return "bg-amber-100 text-amber-800";
  };
  const priorityColor = (p: string) => {
    if (p === "Urgent") return "text-red-600 font-medium";
    if (p === "High") return "text-amber-600";
    return "text-muted-foreground";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
            <p className="text-muted-foreground">
              Track work assigned across team members.
            </p>
          </div>
          <Link href="/team/assignments/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Assignment
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
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
            >
              <div>
                <label className="mb-1 block text-sm font-medium text-muted-foreground">
                  Assigned To
                </label>
                <select
                  name="assignedTo"
                  defaultValue={params.assignedTo ?? ""}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                >
                  <option value="">All</option>
                  {members.map((m: { _id: string; name: string }) => (
                    <option key={m._id} value={m._id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-muted-foreground">
                  Type
                </label>
                <select
                  name="type"
                  defaultValue={params.type ?? "ALL"}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                >
                  <option value="ALL">All</option>
                  {TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
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
                      {s}
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
            <CardTitle>Assignments ({total ?? 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {assignments.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                <p>No assignments match your filters.</p>
                <Link href="/team/assignments/new">
                  <Button className="mt-4" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Assignment
                  </Button>
                </Link>
                <div className="mt-4">
                  <SeedButton
                    endpoint="/api/team/seed"
                    label="Seed demo assignments"
                  />
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Assigned By</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map(
                      (a: {
                        _id: string;
                        title: string;
                        assignmentType: string;
                        assignedToUserName: string;
                        assignedByUserName: string;
                        priority: string;
                        status: string;
                        dueDate?: string;
                      }) => (
                        <TableRow key={a._id}>
                          <TableCell className="font-medium">
                            {a.title}
                          </TableCell>
                          <TableCell className="capitalize">
                            {a.assignmentType}
                          </TableCell>
                          <TableCell>{a.assignedToUserName}</TableCell>
                          <TableCell>{a.assignedByUserName}</TableCell>
                          <TableCell className={priorityColor(a.priority)}>
                            {a.priority}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(a.status)}`}
                            >
                              {a.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {a.dueDate
                              ? new Date(a.dueDate).toLocaleDateString()
                              : "—"}
                          </TableCell>
                          <TableCell>
                            <Link href={`/team/assignments/${a._id}/edit`}>
                              <Button variant="outline" size="sm">
                                Edit
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ),
                    )}
                  </TableBody>
                </Table>
                {totalPages > 1 && (
                  <div className="mt-4 flex gap-2">
                    {page > 1 && (
                      <Link
                        href={`/team/assignments?${new URLSearchParams({ ...params, page: String(page - 1) })}`}
                      >
                        <Button variant="outline" size="sm">
                          Previous
                        </Button>
                      </Link>
                    )}
                    {page < totalPages && (
                      <Link
                        href={`/team/assignments?${new URLSearchParams({ ...params, page: String(page + 1) })}`}
                      >
                        <Button variant="outline" size="sm">
                          Next
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
