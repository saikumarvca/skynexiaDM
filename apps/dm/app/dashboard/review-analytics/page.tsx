import { DashboardLayout } from "@/components/dashboard-layout";
import { ReviewAnalyticsClient } from "@/components/review-analytics/review-analytics-client";
import { serverFetch } from "@/lib/server-fetch";

async function getAnalytics() {
  try {
    const res = await serverFetch("/api/review-analytics");
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function ReviewAnalyticsPage() {
  const data = await getAnalytics();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Review Analytics</h1>
          <p className="text-muted-foreground">
            Overview of review drafts, allocations, and usage.
          </p>
        </div>

        <ReviewAnalyticsClient initialData={data} />
      </div>
    </DashboardLayout>
  );
}
