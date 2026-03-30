import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExternalLink } from "lucide-react";
import dbConnect from "@/lib/mongodb";
import "@/models/ReviewDraft";
import ReviewAllocation from "@/models/ReviewAllocation";
import TeamMember from "@/models/TeamMember";

export const dynamic = "force-dynamic";

const STATUSES = [
  "Unassigned",
  "Assigned",
  "Shared with Customer",
  "Posted",
  "Used",
  "Cancelled",
];

interface PageProps {
  searchParams: Promise<{ assignedTo?: string; status?: string }>;
}

export default async function TeamReviewAssignmentsPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  await dbConnect();

  const query: Record<string, unknown> = {};
  if (params.assignedTo) query.assignedToUserId = params.assignedTo;
  if (params.status && params.status !== "ALL")
    query.allocationStatus = params.status;

  const [allocationDocs, memberDocs] = await Promise.all([
    ReviewAllocation.find(query)
      .populate("draftId", "subject reviewText clientId clientName")
      .sort({ createdAt: -1 })
      .lean(),
    TeamMember.find({ isDeleted: { $ne: true } })
      .select("name")
      .limit(100)
      .lean(),
  ]);
  const allocations = allocationDocs.map((a) => JSON.parse(JSON.stringify(a)));
  const members = memberDocs.map((m) => JSON.parse(JSON.stringify(m)));

  const preview = (text: string, len = 60) =>
    text && text.length > len ? text.slice(0, len) + "…" : text || "—";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Review Assignments
          </h1>
          <p className="text-muted-foreground">
            Review allocations tied to the review workflow. Read-only view.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <form method="get" className="grid gap-4 sm:grid-cols-3">
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
              <div className="flex items-end">
                <button
                  type="submit"
                  className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted/50"
                >
                  Apply
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Review Allocations ({allocations.length})</CardTitle>
            <p className="text-sm text-muted-foreground">
              Manage allocations in{" "}
              <Link
                href="/dashboard/review-allocations"
                className="text-primary hover:underline"
              >
                Review Allocations
              </Link>
            </p>
          </CardHeader>
          <CardContent>
            {allocations.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                <p>No review allocations match your filters.</p>
                <Link href="/dashboard/review-allocations">
                  <span className="mt-2 inline-block text-sm text-primary hover:underline">
                    Go to Review Allocations
                  </span>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Draft Subject</TableHead>
                      <TableHead>Review Preview</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Allocation Status</TableHead>
                      <TableHead>Posted</TableHead>
                      <TableHead>Used</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allocations.map(
                      (a: {
                        _id: string;
                        draftId: {
                          subject?: string;
                          reviewText?: string;
                        } | null;
                        assignedToUserName: string;
                        customerName?: string;
                        platform?: string;
                        allocationStatus: string;
                        postedDate?: string;
                        usedDate?: string;
                      }) => {
                        const subject = a.draftId?.subject ?? "—";
                        const reviewText = a.draftId?.reviewText ?? "";
                        return (
                          <TableRow key={a._id}>
                            <TableCell className="font-medium">
                              {subject}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate text-muted-foreground">
                              {preview(reviewText, 50)}
                            </TableCell>
                            <TableCell>{a.assignedToUserName}</TableCell>
                            <TableCell>{a.customerName ?? "—"}</TableCell>
                            <TableCell>{a.platform ?? "—"}</TableCell>
                            <TableCell>
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${a.allocationStatus === "Used" ? "bg-green-100 text-green-800" : a.allocationStatus === "Posted" ? "bg-blue-100 text-blue-800" : a.allocationStatus === "Cancelled" ? "bg-gray-100 text-gray-800" : "bg-amber-100 text-amber-800"}`}
                              >
                                {a.allocationStatus}
                              </span>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {a.postedDate
                                ? new Date(a.postedDate).toLocaleDateString()
                                : "—"}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {a.usedDate
                                ? new Date(a.usedDate).toLocaleDateString()
                                : "—"}
                            </TableCell>
                            <TableCell>
                              <Link
                                href="/dashboard/review-allocations"
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Link>
                            </TableCell>
                          </TableRow>
                        );
                      },
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
