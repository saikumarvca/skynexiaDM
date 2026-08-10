import { notFound } from "next/navigation";
import ReviewDraftsPage from "@/app/dashboard/review-drafts/page";
import ReviewAllocationsPage from "@/app/dashboard/review-allocations/page";
import MyAssignedReviewsPage from "@/app/dashboard/my-assigned-reviews/page";
import UsedReviewsPage from "@/app/dashboard/used-reviews/page";
import ReviewAnalyticsPage from "@/app/dashboard/review-analytics/page";
import ReviewTemplatesPage from "@/app/dashboard/review-templates/page";
import ReviewTemplateEditPage from "@/app/dashboard/review-templates/[templateId]/edit/page";
import ReviewRequestsPage from "@/app/dashboard/review-requests/page";

export default async function ReviewsSlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const path = slug.join("/");
  const AnyReviewDraftsPage = ReviewDraftsPage as any;
  const AnyReviewAllocationsPage = ReviewAllocationsPage as any;
  const AnyMyAssignedReviewsPage = MyAssignedReviewsPage as any;
  const AnyUsedReviewsPage = UsedReviewsPage as any;
  const AnyReviewAnalyticsPage = ReviewAnalyticsPage as any;
  const AnyReviewTemplatesPage = ReviewTemplatesPage as any;
  const AnyReviewTemplateEditPage = ReviewTemplateEditPage as any;
  const AnyReviewRequestsPage = ReviewRequestsPage as any;

  if (path === "drafts") return <AnyReviewDraftsPage searchParams={searchParams} />;
  if (path === "allocations") return <AnyReviewAllocationsPage searchParams={searchParams} />;
  if (path === "my-assigned") return <AnyMyAssignedReviewsPage searchParams={searchParams} />;
  if (path === "used") return <AnyUsedReviewsPage searchParams={searchParams} />;
  if (path === "analytics") return <AnyReviewAnalyticsPage searchParams={searchParams} />;
  if (path === "templates") return <AnyReviewTemplatesPage searchParams={searchParams} />;
  if (path === "requests") return <AnyReviewRequestsPage searchParams={searchParams} />;
  if (slug.length === 3 && slug[0] === "templates" && slug[2] === "edit") {
    return (
      <AnyReviewTemplateEditPage
        params={Promise.resolve({ templateId: slug[1] })}
        searchParams={searchParams}
      />
    );
  }

  notFound();
}
