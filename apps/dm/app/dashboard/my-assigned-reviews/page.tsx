import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard-layout";
import { ReviewAllocationTable } from "@/components/reviews/review-allocation-table";
import { Button } from "@/components/ui/button";
import { Client } from "@/types";
import type { ReviewAllocation } from "@/types/reviews";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

async function getAllocations(assignedToUserId: string | undefined): Promise<ReviewAllocation[]> {
  const url = new URL(`${BASE}/api/review-allocations`);
  if (assignedToUserId) url.searchParams.set("assignedToUserId", assignedToUserId);
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch allocations");
  return res.json();
}

async function getTeamMembers(): Promise<{ _id: string; name: string }[]> {
  const res = await fetch(`${BASE}/api/team/members?status=Active&limit=100`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.items ?? [];
}

async function markShared(id: string, data: { customerName: string; customerContact?: string; platform?: string; sentDate: string }) {
  "use server";
  const res = await fetch(`${BASE}/api/review-allocations/${id}/mark-shared`, {
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
    platform: string;
    reviewLink: string;
    proofUrl?: string;
    postedDate: string;
    markedUsedBy: string;
    remarks?: string;
  }
) {
  "use server";
  const res = await fetch(`${BASE}/api/review-allocations/${id}/mark-posted`, {
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
  searchParams: Promise<{ assignedTo?: string }>;
}

export default async function MyAssignedReviewsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const [allocations, teamMembers] = await Promise.all([
    getAllocations(params.assignedTo),
    getTeamMembers(),
  ]);

  const selectedUserId = params.assignedTo || teamMembers[0]?._id;
  const filtered = selectedUserId
    ? allocations.filter((a) => a.assignedToUserId === selectedUserId)
    : allocations;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Assigned Reviews</h1>
          <p className="text-muted-foreground">
            View and manage review drafts assigned to you. Mark shared, posted, or used.
          </p>
        </div>

        <form method="get" action="/dashboard/my-assigned-reviews" className="flex flex-wrap gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-muted-foreground">View as</label>
            <select
              name="assignedTo"
              defaultValue={params.assignedTo ?? teamMembers[0]?._id ?? ""}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm min-w-[180px]"
            >
              {teamMembers.map((u) => (
                <option key={u._id} value={u._id}>{u.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button type="submit" variant="outline">Apply</Button>
          </div>
        </form>

        <ReviewAllocationTable
          allocations={filtered}
          onMarkShared={markShared}
          onMarkPosted={markPosted}
          showMyAssignedOnly
        />
      </div>
    </DashboardLayout>
  );
}
