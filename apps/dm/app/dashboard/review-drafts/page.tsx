import { DashboardLayout } from "@/components/dashboard-layout";
import { ReviewDraftTable } from "@/components/reviews/review-draft-table";
import { Button } from "@/components/ui/button";
import { Client } from "@/types";
import type {
  ReviewDraft,
  ReviewDraftFormData,
  AssignDraftFormData,
} from "@/types/reviews";
import dbConnect from "@/lib/mongodb";
import ReviewDraftModel from "@/models/ReviewDraft";
import ClientModel from "@/models/Client";
import TeamMember from "@/models/TeamMember";
import {
  getOrCreateUnassignedClient,
  UNASSIGNED_CLIENT_NAME,
} from "@/lib/reviews/unassigned-client";

import { serverFetch } from "@/lib/server-fetch";
import { getCurrentUserTeamPermissions } from "@/lib/team/current-user-permissions";
import { requireAnyPermission } from "@/lib/team/require-permission";

async function getDrafts(params: {
  clientId?: string;
  status?: string;
  category?: string;
  language?: string;
  assignee?: string;
  platform?: string;
}): Promise<ReviewDraft[]> {
  await dbConnect();
  const query: Record<string, unknown> = {};
  if (params.clientId) query.clientId = params.clientId;
  if (params.status) query.status = params.status;
  if (params.category) query.category = params.category;
  if (params.language) query.language = params.language;
  let docs = await ReviewDraftModel.find(query)
    .populate("clientId", "name businessName")
    .sort({ createdAt: -1 })
    .lean();
  if (
    (params.assignee && params.assignee !== "ALL") ||
    (params.platform && params.platform !== "ALL")
  ) {
    const allocationsRaw = await serverFetch(
      `/api/review-allocations?draftIds=${docs.map((d) => d._id.toString()).join(",")}`,
      { cache: "no-store" },
    );
    const allocations = allocationsRaw.ok
      ? ((await allocationsRaw.json()) as {
          draftId?: string | { _id?: string };
          assignedToUserId?: string;
          assignedToUserName?: string;
          platform?: string;
        }[])
      : [];
    const assignedIdSet = new Set<string>();
    const platformMap = new Map<string, string>();
    for (const a of allocations) {
      const draftId =
        typeof a.draftId === "string" ? a.draftId : (a.draftId?._id ?? "");
      if (!draftId) continue;
      if (!assignedIdSet.has(draftId) && a.assignedToUserId) {
        assignedIdSet.add(draftId);
      }
      if (!platformMap.has(draftId) && a.platform) {
        platformMap.set(draftId, a.platform);
      }
    }
    if (params.assignee === "UNASSIGNED") {
      docs = docs.filter((d) => !assignedIdSet.has(d._id.toString()));
    }
    if (params.assignee === "ASSIGNED") {
      docs = docs.filter((d) => assignedIdSet.has(d._id.toString()));
    }
    if (params.platform && params.platform !== "ALL") {
      if (params.platform === "UNASSIGNED") {
        docs = docs.filter((d) => !(platformMap.get(d._id.toString()) ?? "").trim());
      } else {
        docs = docs.filter(
          (d) => (platformMap.get(d._id.toString()) ?? "") === params.platform,
        );
      }
    }
  }
  return docs.map((d) => JSON.parse(JSON.stringify(d)));
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
  if (!hasUnassigned) {
    clients.unshift(JSON.parse(JSON.stringify(unassigned)) as Client);
  }
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

async function createDraft(data: ReviewDraftFormData & { createdBy?: string }) {
  "use server";
  const res = await serverFetch("/api/review-drafts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, createdBy: "system" }),
  });
  if (!res.ok) throw new Error("Failed to create draft");
  return res.json();
}

async function updateDraft(id: string, data: Partial<ReviewDraftFormData>) {
  "use server";
  const res = await serverFetch(`/api/review-drafts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update draft");
  return res.json();
}

async function duplicateDraft(id: string) {
  "use server";
  const res = await serverFetch(`/api/review-drafts/${id}/duplicate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ performedBy: "system" }),
  });
  if (!res.ok) throw new Error("Failed to duplicate draft");
  return res.json();
}

async function assignDraft(draftId: string, data: AssignDraftFormData) {
  "use server";
  const res = await serverFetch(`/api/review-drafts/${draftId}/assign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? "Failed to assign draft");
  }
  return res.json();
}

async function archiveDraft(id: string) {
  "use server";
  const res = await serverFetch(`/api/review-drafts/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to archive draft");
  return res.json();
}

async function reassignDraftClients(
  items: { draftId: string; clientId: string }[],
) {
  "use server";
  const res = await serverFetch(`/api/review-drafts/assign-client`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items, performedBy: "system" }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to reassign draft clients");
  }
  return res.json();
}

interface PageProps {
  searchParams: Promise<{
    clientId?: string;
    status?: string;
    category?: string;
    language?: string;
    assignee?: string;
    platform?: string;
  }>;
}

export default async function ReviewDraftsPage({ searchParams }: PageProps) {
  const team = await getCurrentUserTeamPermissions();
  requireAnyPermission(team.permissions, ["manage_reviews"]);

  const params = await searchParams;
  const unassignedClient = await getOrCreateUnassignedClient();
  const selectedClientId =
    params.clientId === "UNASSIGNED" ? unassignedClient._id.toString() : params.clientId;
  const [drafts, clients, teamMembers] = await Promise.all([
    getDrafts({
      clientId:
        selectedClientId && selectedClientId !== "ALL" ? selectedClientId : undefined,
      status:
        params.status && params.status !== "ALL" ? params.status : undefined,
      category: params.category,
      language: params.language,
      assignee: params.assignee,
      platform: params.platform,
    }),
    getClients(),
    getTeamMembers(),
  ]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Review Drafts</h1>
          <p className="text-muted-foreground">
            Manage your suggested review comment bank. Create, assign, and track
            drafts through the workflow.
          </p>
          {params.clientId === "UNASSIGNED" ? (
            <p className="mt-1 text-sm text-primary">
              Viewing drafts for client: {UNASSIGNED_CLIENT_NAME}
            </p>
          ) : null}
        </div>

        <form
          method="get"
          action="/dashboard/review-drafts"
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
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm min-w-[140px]"
            >
              <option value="ALL">All</option>
              <option value="Available">Available</option>
              <option value="Allocated">Allocated</option>
              <option value="Shared">Shared</option>
              <option value="Used">Used</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-muted-foreground">
              Assignee
            </label>
            <select
              name="assignee"
              defaultValue={params.assignee ?? "ALL"}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm min-w-[140px]"
            >
              <option value="ALL">All</option>
              <option value="UNASSIGNED">Unassigned</option>
              <option value="ASSIGNED">Assigned</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-muted-foreground">
              Category
            </label>
            <input
              name="category"
              defaultValue={params.category ?? ""}
              placeholder="Category"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm min-w-[120px]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-muted-foreground">
              Language
            </label>
            <input
              name="language"
              defaultValue={params.language ?? ""}
              placeholder="Language"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm min-w-[120px]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-muted-foreground">
              Platform
            </label>
            <select
              name="platform"
              defaultValue={params.platform ?? "ALL"}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm min-w-[140px]"
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
          <div className="flex items-end">
            <Button type="submit" variant="outline">
              Apply
            </Button>
          </div>
        </form>

        <ReviewDraftTable
          drafts={drafts}
          clients={clients}
          users={teamMembers}
          selectedClientId={params.clientId}
          onCreate={createDraft}
          onUpdate={updateDraft}
          onDuplicate={duplicateDraft}
          onAssign={assignDraft}
          onReassignClients={reassignDraftClients}
          onArchive={archiveDraft}
        />
      </div>
    </DashboardLayout>
  );
}
