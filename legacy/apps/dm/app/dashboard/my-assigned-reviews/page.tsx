import { DashboardLayout } from "@/components/dashboard-layout";
import { ReviewAllocationTable } from "@/components/reviews/review-allocation-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { ReviewAllocation } from "@/types/reviews";
import dbConnect from "@/lib/mongodb";
import "@/models/ReviewDraft";
import ReviewAllocationModel from "@/models/ReviewAllocation";
import TeamMember from "@/models/TeamMember";

import { serverFetch } from "@/lib/server-fetch";
import { getCurrentUserTeamPermissions } from "@/lib/team/current-user-permissions";
import { requireAnyPermission } from "@/lib/team/require-permission";

async function getAllocations(
  assignedToUserId: string | undefined,
): Promise<ReviewAllocation[]> {
  await dbConnect();
  const query: Record<string, unknown> = {};
  if (assignedToUserId) query.assignedToUserId = assignedToUserId;
  const docs = await ReviewAllocationModel.find(query)
    .populate("draftId", "subject reviewText clientId clientName")
    .sort({ createdAt: -1 })
    .lean();
  return docs.map((a) => JSON.parse(JSON.stringify(a)));
}

async function getTeamMembers(): Promise<{ _id: string; name: string }[]> {
  await dbConnect();
  const docs = await TeamMember.find({
    status: "Active",
    isDeleted: { $ne: true },
  })
    .select("name")
    .limit(100)
    .lean();
  return docs.map((m) => ({ _id: m._id.toString(), name: m.name }));
}

async function markShared(
  id: string,
  data: {
    customerName: string;
    customerContact?: string;
    platform?: string;
    sentDate: string;
  },
) {
  "use server";
  const res = await serverFetch(`/api/review-allocations/${id}/mark-shared`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? "Failed to mark shared");
  }
  return res.json();
}

async function markPosted(
  id: string,
  data: {
    postedByName: string;
    customerContact?: string;
    platform: string;
    reviewLink: string;
    proofUrl?: string;
    postedDate: string;
    markedUsedBy: string;
    remarks?: string;
  },
) {
  "use server";
  const res = await serverFetch(`/api/review-allocations/${id}/mark-posted`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? "Failed to mark posted");
  }
  return res.json();
}

interface PageProps {
  searchParams: Promise<{ assignedTo?: string; view?: string }>;
}

export default async function MyAssignedReviewsPage({
  searchParams,
}: PageProps) {
  const team = await getCurrentUserTeamPermissions();
  requireAnyPermission(team.permissions, [
    "work_assigned_reviews",
    "view_reviews",
    "manage_reviews",
  ]);

  const params = await searchParams;
  const canViewAsOthers =
    team.permissions.includes("manage_reviews") ||
    team.permissions.includes("assign_reviews");
  const forcedAssignedTo = canViewAsOthers
    ? params.assignedTo
    : team.teamMemberId;

  const [allocations, teamMembers] = await Promise.all([
    getAllocations(forcedAssignedTo),
    getTeamMembers(),
  ]);

  const selectedUserId = forcedAssignedTo || teamMembers[0]?._id;
  const byAssignee = selectedUserId
    ? allocations.filter((a) => a.assignedToUserId === selectedUserId)
    : allocations;
  const view = params.view === "used" ? "used" : "open";
  const filtered = byAssignee.filter((a) => {
    const isUsed =
      a.allocationStatus === "Used" || a.allocationStatus === "Posted";
    return view === "used" ? isUsed : !isUsed;
  });

  const toggleParams = new URLSearchParams();
  if (selectedUserId) toggleParams.set("assignedTo", selectedUserId);
  toggleParams.set("view", view === "open" ? "used" : "open");
  const toggleHref = `/reviews/my-assigned?${toggleParams.toString()}`;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            My Assigned Reviews
          </h1>
          <p className="text-muted-foreground">
            View and manage review drafts assigned to you. Mark shared, posted,
            or used.
          </p>
        </div>

        <div className="flex items-center justify-start gap-3">
          <p className="text-sm text-muted-foreground">
            Showing {view === "open" ? "Open" : "Used"} assigned reviews.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href={toggleHref}>
              {view === "open" ? "View Used Reviews" : "View Open Reviews"}
            </Link>
          </Button>
        </div>

        {canViewAsOthers ? (
          <form
            method="get"
            action="/reviews/my-assigned"
            className="flex flex-wrap gap-4"
          >
            <div>
              <label className="mb-1 block text-sm font-medium text-muted-foreground">
                View as
              </label>
              <select
                name="assignedTo"
                defaultValue={params.assignedTo ?? teamMembers[0]?._id ?? ""}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm min-w-[180px]"
              >
                {teamMembers.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name}
                  </option>
                ))}
              </select>
              <input type="hidden" name="view" value={view} />
            </div>
            <div className="flex items-end">
              <Button type="submit" variant="outline">
                Apply
              </Button>
            </div>
          </form>
        ) : null}

        <ReviewAllocationTable
          allocations={filtered}
          onMarkShared={markShared}
          onMarkPosted={markPosted}
          showMyAssignedOnly
          viewMode="responsive"
        />
      </div>
    </DashboardLayout>
  );
}
