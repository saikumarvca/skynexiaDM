import { DashboardLayout } from "@/components/dashboard-layout";
import { ReviewDraftTable } from "@/components/reviews/review-draft-table";
import { Button } from "@/components/ui/button";
import { Client } from "@/types";
import type { ReviewDraft, ReviewDraftFormData, AssignDraftFormData } from "@/types/reviews";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

async function getDrafts(params: {
  clientId?: string;
  status?: string;
  category?: string;
  language?: string;
}): Promise<ReviewDraft[]> {
  const url = new URL(`${BASE}/api/review-drafts`);
  if (params.clientId) url.searchParams.set("clientId", params.clientId);
  if (params.status) url.searchParams.set("status", params.status);
  if (params.category) url.searchParams.set("category", params.category);
  if (params.language) url.searchParams.set("language", params.language);
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch drafts");
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

async function createDraft(data: ReviewDraftFormData & { createdBy?: string }) {
  "use server";
  const res = await fetch(`${BASE}/api/review-drafts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, createdBy: "system" }),
  });
  if (!res.ok) throw new Error("Failed to create draft");
  return res.json();
}

async function updateDraft(id: string, data: Partial<ReviewDraftFormData>) {
  "use server";
  const res = await fetch(`${BASE}/api/review-drafts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update draft");
  return res.json();
}

async function duplicateDraft(id: string) {
  "use server";
  const res = await fetch(`${BASE}/api/review-drafts/${id}/duplicate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ performedBy: "system" }),
  });
  if (!res.ok) throw new Error("Failed to duplicate draft");
  return res.json();
}

async function assignDraft(draftId: string, data: AssignDraftFormData) {
  "use server";
  const res = await fetch(`${BASE}/api/review-drafts/${draftId}/assign`, {
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
  const res = await fetch(`${BASE}/api/review-drafts/${id}`, {
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
  const params = await searchParams;
  const [drafts, clients, teamMembers] = await Promise.all([
    getDrafts({
      clientId: params.clientId && params.clientId !== "ALL" ? params.clientId : undefined,
      status: params.status && params.status !== "ALL" ? params.status : undefined,
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
            Manage your suggested review comment bank. Create, assign, and track drafts through the workflow.
          </p>
        </div>

        <form method="get" action="/dashboard/review-drafts" className="flex flex-wrap gap-4">
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
            <label className="mb-1 block text-sm font-medium text-muted-foreground">Category</label>
            <input
              name="category"
              defaultValue={params.category ?? ""}
              placeholder="Category"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm min-w-[120px]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-muted-foreground">Language</label>
            <input
              name="language"
              defaultValue={params.language ?? ""}
              placeholder="Language"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm min-w-[120px]"
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" variant="outline">Apply</Button>
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
