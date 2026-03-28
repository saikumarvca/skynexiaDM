import { DashboardLayout } from "@/components/dashboard-layout";
import { requireUser } from "@/lib/auth";
import { serverFetch } from "@/lib/server-fetch";
import { ReviewRequestsClient } from "@/components/review-requests/review-requests-client";

type ReviewRequestRow = {
  _id: string;
  recipientName: string;
  recipientEmail: string;
  clientId: { _id: string; name: string; businessName: string } | string;
  status: "PENDING" | "SENT" | "FAILED";
  sentAt?: string | null;
  reviewSubmitted: boolean;
  message?: string;
  createdAt: string;
};

type ClientOption = { _id: string; name: string; businessName: string };

async function getReviewRequests(): Promise<ReviewRequestRow[]> {
  const res = await serverFetch("/api/review-requests", { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

async function getClients(): Promise<ClientOption[]> {
  const res = await serverFetch("/api/clients?limit=200", { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export default async function ReviewRequestsPage() {
  await requireUser();

  const [requests, clients] = await Promise.all([getReviewRequests(), getClients()]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Review Requests</h1>
          <p className="text-muted-foreground">
            Send review request emails to clients and track responses.
          </p>
        </div>
        <ReviewRequestsClient initialRequests={requests} clients={clients} />
      </div>
    </DashboardLayout>
  );
}
