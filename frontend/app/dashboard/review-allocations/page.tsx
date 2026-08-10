import { DashboardLayout } from "@/components/dashboard-layout";
import { ReviewAllocationTable } from "@/components/reviews/review-allocation-table";
import { Button } from "@/components/ui/button";
import { Client } from "@/types";
import type { ReviewAllocation } from "@/types/reviews";
import dbConnect from "@/lib/mongodb";
import "@/models/ReviewDraft";
import ReviewAllocationModel from "@/models/ReviewAllocation";
import ClientModel from "@/models/Client";
import TeamMember from "@/models/TeamMember";
import {
  getOrCreateUnassignedClient,
  UNASSIGNED_CLIENT_NAME,
} from "@/lib/reviews/unassigned-client";

import { serverFetch } from "@/lib/server-fetch";

async function getAllocations(params: {
  clientId?: string;
  status?: string;
  assignedToUserId?: string;
  platform?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<ReviewAllocation[]> {
  await dbConnect();
  const query: Record<string, unknown> = {};
  if (params.status) query.allocationStatus = params.status;
  if (params.assignedToUserId) {
    if (params.assignedToUserId === "UNASSIGNED") {
      query.$or = [
        { assignedToUserId: { $exists: false } },
        { assignedToUserId: null },
        { assignedToUserId: "" },
        { assignedToUserId: "UNASSIGNED" },
      ];
    } else {
      query.assignedToUserId = params.assignedToUserId;
    }
  }
  if (params.platform && params.platform !== "UNASSIGNED") {
    query.platform = params.platform;
  }
  if (params.dateFrom || params.dateTo) {
    query.assignedDate = {};
    if (params.dateFrom)
      (query.assignedDate as Record<string, unknown>).$gte = new Date(
        params.dateFrom,
      );
    if (params.dateTo)
      (query.assignedDate as Record<string, unknown>).$lte = new Date(
        params.dateTo + "T23:59:59.999Z",
      );
  }
  let allocations = await ReviewAllocationModel.find(query)
    .populate("draftId", "subject reviewText clientId clientName")
    .sort({ createdAt: -1 })
    .lean();
  if (params.clientId) {
    allocations = allocations.filter((a) => {
      const draft = a.draftId as {
        clientId?: { toString: () => string };
      } | null;
      return draft?.clientId?.toString?.() === params.clientId;
    });
  }
  if (params.platform === "UNASSIGNED") {
    allocations = allocations.filter(
      (a) => !String((a.platform as string | undefined) ?? "").trim(),
    );
  }
  return allocations.map((a) => JSON.parse(JSON.stringify(a)));
}

async function getClients(): Promise<Client[]> {
  await dbConnect();
  const unassigned = await getOrCreateUnassignedClient();
  const docs = await ClientModel.find({})
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();
  const clients = docs.map((c) => JSON.parse(JSON.stringify(c))) as Client[];
  const hasUnassigned = clients.some((c) => c._id === unassigned._id.toString());
  if (!hasUnassigned) clients.unshift(JSON.parse(JSON.stringify(unassigned)) as Client);
  return clients;
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

async function cancelAllocation(id: string) {
  "use server";
  const res = await serverFetch(`/api/review-allocations/${id}`, {
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

export default async function ReviewAllocationsPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const unassignedClient = await getOrCreateUnassignedClient();
  const selectedClientId =
    params.clientId === "UNASSIGNED" ? unassignedClient._id.toString() : params.clientId;
  const [allocations, clients, teamMembers] = await Promise.all([
    getAllocations({
      clientId:
        selectedClientId && selectedClientId !== "ALL"
          ? selectedClientId
          : undefined,
      status:
        params.status && params.status !== "ALL" ? params.status : undefined,
      assignedToUserId:
        params.assignedTo && params.assignedTo !== "ALL"
          ? params.assignedTo
          : undefined,
      platform: params.platform && params.platform !== "ALL" ? params.platform : undefined,
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
          <h1 className="text-3xl font-bold tracking-tight">
            Review Allocations
          </h1>
          <p className="text-muted-foreground">
            Track assignment of review drafts to team members and customers.
          </p>
          {params.clientId === "UNASSIGNED" ? (
            <p className="mt-1 text-sm text-primary">
              Viewing allocations for client: {UNASSIGNED_CLIENT_NAME}
            </p>
          ) : null}
        </div>

        <form
          method="get"
          action="/dashboard/review-allocations"
          className="flex flex-wrap gap-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-muted-foreground">
              Client
            </label>
            <select
              name="clientId"
              defaultValue={params.clientId ?? "ALL"}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm min-w-[160px]"
            >
              <option value="ALL">All clients</option>
              <option value="UNASSIGNED">{UNASSIGNED_CLIENT_NAME}</option>
              {clients
                .filter((c) => c._id !== unassignedClient._id.toString())
                .map((c) => (
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
            <label className="mb-1 block text-sm font-medium text-muted-foreground">
              Assigned To
            </label>
            <select
              name="assignedTo"
              defaultValue={params.assignedTo ?? "ALL"}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm min-w-[140px]"
            >
              <option value="ALL">All</option>
              <option value="UNASSIGNED">Unassigned</option>
              {teamMembers.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-muted-foreground">
              Platform
            </label>
            <select
              name="platform"
              defaultValue={params.platform ?? "ALL"}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm min-w-[120px]"
            >
              <option value="ALL">All</option>
              <option value="UNASSIGNED">Unassigned</option>
              <option value="Google">Google</option>
              <option value="Facebook">Facebook</option>
              <option value="Justdial">Justdial</option>
              <option value="Website">Website</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-muted-foreground">
              Date From
            </label>
            <input
              name="dateFrom"
              type="date"
              defaultValue={params.dateFrom ?? ""}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-muted-foreground">
              Date To
            </label>
            <input
              name="dateTo"
              type="date"
              defaultValue={params.dateTo ?? ""}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" variant="outline">
              Apply
            </Button>
          </div>
        </form>

        <ReviewAllocationTable
          allocations={allocations}
          teamMembers={teamMembers}
          onMarkShared={markShared}
          onMarkPosted={markPosted}
          onCancel={cancelAllocation}
        />
      </div>
    </DashboardLayout>
  );
}
