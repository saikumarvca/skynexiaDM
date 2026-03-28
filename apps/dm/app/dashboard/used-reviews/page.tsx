import { DashboardLayout } from "@/components/dashboard-layout";
import { UsedReviewsTable } from "@/components/reviews/used-reviews-table";
import { Button } from "@/components/ui/button";
import type { PostedReview } from "@/types/reviews";
import dbConnect from "@/lib/mongodb";
import "@/models/ReviewAllocation";
import "@/models/ReviewDraft";
import PostedReviewModel from "@/models/PostedReview";

async function getPostedReviews(params: {
  platform?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}): Promise<PostedReview[]> {
  await dbConnect();
  const query: Record<string, unknown> = {};
  if (params.platform) query.platform = params.platform;
  if (params.dateFrom || params.dateTo) {
    query.postedDate = {};
    if (params.dateFrom) (query.postedDate as Record<string, unknown>).$gte = new Date(params.dateFrom);
    if (params.dateTo) (query.postedDate as Record<string, unknown>).$lte = new Date(params.dateTo + "T23:59:59.999Z");
  }
  let docs = await PostedReviewModel.find(query)
    .populate("draftId", "subject reviewText")
    .populate("allocationId", "assignedToUserName")
    .sort({ postedDate: -1 })
    .lean();
  if (params.search) {
    const s = params.search.toLowerCase();
    docs = docs.filter((p) => {
      const draft = p.draftId as { subject?: string; reviewText?: string } | null;
      return (
        (draft?.subject ?? "").toLowerCase().includes(s) ||
        (draft?.reviewText ?? "").toLowerCase().includes(s) ||
        (p.postedByName ?? "").toLowerCase().includes(s)
      );
    });
  }
  return docs.map((p) => JSON.parse(JSON.stringify(p)));
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
