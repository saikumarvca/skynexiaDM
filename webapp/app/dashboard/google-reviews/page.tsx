import { DashboardLayout } from "@/components/dashboard-layout";
import { GoogleReviewsClient } from "@/components/google-reviews/google-reviews-client";
import { serverFetch } from "@/lib/server-fetch";

export const dynamic = "force-dynamic";

async function getClients() {
  try {
    const res = await serverFetch("/api/clients?limit=500");
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function getExternalReviews() {
  try {
    const res = await serverFetch("/api/google-reviews");
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function GoogleReviewsPage() {
  const [clients, reviews] = await Promise.all([
    getClients(),
    getExternalReviews(),
  ]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Google Reviews</h1>
          <p className="text-muted-foreground">
            Import external reviews from Google Places or paste them manually.
          </p>
        </div>
        <GoogleReviewsClient clients={clients} initialReviews={reviews} />
      </div>
    </DashboardLayout>
  );
}
