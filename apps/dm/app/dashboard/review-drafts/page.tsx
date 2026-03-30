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

import { serverFetch } from "@/lib/server-fetch";
import { getCurrentUserTeamPermissions } from "@/lib/team/current-user-permissions";
import { requireAnyPermission } from "@/lib/team/require-permission";

async function getDrafts(params: {
  clientId?: string;
  status?: string;
  category?: string;
  language?: string;
}): Promise<ReviewDraft[]> {
  await dbConnect();
  const query: Record<string, unknown> = {};
  if (params.clientId) query.clientId = params.clientId;
  if (params.status) query.status = params.status;
  if (params.category) query.category = params.category;
  if (params.language) query.language = params.language;
  const docs = await ReviewDraftModel.find(query)
    .populate("clientId", "name businessName")
    .sort({ createdAt: -1 })
    .lean();
  return docs.map((d) => JSON.parse(JSON.stringify(d)));
}

async function getClients(): Promise<Client[]> {
  await dbConnect();
  const docs = await ClientModel.find({})
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();
  return docs.map((c) => JSON.parse(JSON.stringify(c)));
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

interface PageProps {
  searchParams: Promise<{
    clientId?: string;
    status?: string;
    category?: string;
    language?: string;
  }>;
}

export default async function ReviewDraftsPage({ searchParams }: PageProps) {
  const team = await getCurrentUserTeamPermissions();
  requireAnyPermission(team.permissions, ["manage_reviews"]);

  const params = await searchParams;
  const [drafts, clients, teamMembers] = await Promise.all([
    getDrafts({
      clientId:
        params.clientId && params.clientId !== "ALL"
          ? params.clientId
          : undefined,
      status:
        params.status && params.status !== "ALL" ? params.status : undefined,
      category: params.category,
      language: params.language,
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
          onArchive={archiveDraft}
        />
      </div>
    </DashboardLayout>
  );
}
