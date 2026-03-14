import { DashboardLayout } from "@/components/dashboard-layout";
import { UsedReviewsTable } from "@/components/reviews/used-reviews-table";
import { Button } from "@/components/ui/button";
import type { PostedReview } from "@/types/reviews";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

async function getPostedReviews(params: {
  platform?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}): Promise<PostedReview[]> {
  const url = new URL(`${BASE}/api/posted-reviews`);
  if (params.platform) url.searchParams.set("platform", params.platform);
  if (params.dateFrom) url.searchParams.set("dateFrom", params.dateFrom);
  if (params.dateTo) url.searchParams.set("dateTo", params.dateTo);
  if (params.search) url.searchParams.set("search", params.search);
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch posted reviews");
  return res.json();
}

interface PageProps {
  searchParams: Promise<{
    platform?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  }>;
}

export default async function UsedReviewsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const posted = await getPostedReviews({
    platform: params.platform && params.platform !== "ALL" ? params.platform : undefined,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    search: params.search,
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Used Reviews</h1>
          <p className="text-muted-foreground">
            Completed review records with proof. View posted reviews and their history.
          </p>
        </div>

        <form method="get" action="/dashboard/used-reviews" className="flex flex-wrap gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-muted-foreground">Platform</label>
            <select
              name="platform"
              defaultValue={params.platform ?? "ALL"}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm min-w-[140px]"
            >
              <option value="ALL">All</option>
              <option value="Google">Google</option>
              <option value="Facebook">Facebook</option>
              <option value="Justdial">Justdial</option>
              <option value="Website">Website</option>
            </select>
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
          <div>
            <label className="mb-1 block text-sm font-medium text-muted-foreground">Search</label>
            <input
              name="search"
              defaultValue={params.search ?? ""}
              placeholder="Subject, posted by..."
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm min-w-[180px]"
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" variant="outline">Apply</Button>
          </div>
        </form>

        <UsedReviewsTable posted={posted} />
      </div>
    </DashboardLayout>
  );
}
