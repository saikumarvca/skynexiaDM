import { DashboardLayout } from "@/components/dashboard-layout";
import { ReviewAllocationTable } from "@/components/reviews/review-allocation-table";
import { Button } from "@/components/ui/button";
import { Client } from "@/types";
import type { ReviewAllocation } from "@/types/reviews";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

async function getAllocations(params: {
  clientId?: string;
  status?: string;
  assignedToUserId?: string;
  platform?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<ReviewAllocation[]> {
  const url = new URL(`${BASE}/api/review-allocations`);
  if (params.clientId) url.searchParams.set("clientId", params.clientId);
  if (params.status) url.searchParams.set("status", params.status);
  if (params.assignedToUserId) url.searchParams.set("assignedToUserId", params.assignedToUserId);
  if (params.platform) url.searchParams.set("platform", params.platform);
  if (params.dateFrom) url.searchParams.set("dateFrom", params.dateFrom);
  if (params.dateTo) url.searchParams.set("dateTo", params.dateTo);
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch allocations");
  return res.json();
}

async function getClients(): Promise<Client[]> {
  const res = await fetch(`${BASE}/api/clients?limit=500`, { cache: "no-store" });
  if (!res.ok) return [];
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

async function cancelAllocation(id: string) {
  "use server";
  const res = await fetch(`${BASE}/api/review-allocations/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ allocationStatus: "Cancelled" }),
  });
  if (!res.ok) throw new Error("Failed to cancel");
  return res.json();
}

interface PageProps {
  searchParams: Promise<{
    clientId?: string;
    status?: string;
    assignedTo?: string;
    platform?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}

export default async function ReviewAllocationsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const [allocations, clients, teamMembers] = await Promise.all([
    getAllocations({
      clientId: params.clientId && params.clientId !== "ALL" ? params.clientId : undefined,
      status: params.status && params.status !== "ALL" ? params.status : undefined,
      assignedToUserId: params.assignedTo && params.assignedTo !== "ALL" ? params.assignedTo : undefined,
      platform: params.platform,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
    }),
    getClients(),
    getTeamMembers(),
  ]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Review Allocations</h1>
          <p className="text-muted-foreground">
            Track assignment of review drafts to team members and customers.
          </p>
        </div>

        <form method="get" action="/dashboard/review-allocations" className="flex flex-wrap gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-muted-foreground">Client</label>
            <select
              name="clientId"
              defaultValue={params.clientId ?? "ALL"}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm min-w-[160px]"
            >
              <option value="ALL">All clients</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>{c.businessName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-muted-foreground">Status</label>
            <select
              name="status"
              defaultValue={params.status ?? "ALL"}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm min-w-[160px]"
            >
              <option value="ALL">All</option>
              <option value="Assigned">Assigned</option>
              <option value="Shared with Customer">Shared with Customer</option>
              <option value="Posted">Posted</option>
              <option value="Used">Used</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-muted-foreground">Assigned To</label>
            <select
              name="assignedTo"
              defaultValue={params.assignedTo ?? "ALL"}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm min-w-[140px]"
            >
              <option value="ALL">All</option>
              {teamMembers.map((u) => (
                <option key={u._id} value={u._id}>{u.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-muted-foreground">Platform</label>
            <input
              name="platform"
              defaultValue={params.platform ?? ""}
              placeholder="e.g. Google"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm min-w-[120px]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-muted-foreground">Date From</label>
            <input
              name="dateFrom"
              type="date"
              defaultValue={params.dateFrom ?? ""}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-muted-foreground">Date To</label>
            <input
              name="dateTo"
              type="date"
              defaultValue={params.dateTo ?? ""}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" variant="outline">Apply</Button>
          </div>
        </form>

        <ReviewAllocationTable
          allocations={allocations}
          onMarkShared={markShared}
          onMarkPosted={markPosted}
          onCancel={cancelAllocation}
        />
      </div>
    </DashboardLayout>
  );
}
