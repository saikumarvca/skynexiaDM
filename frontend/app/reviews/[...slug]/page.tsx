import { notFound } from "next/navigation";
import type { ComponentType } from "react";
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
  const AnyReviewDraftsPage = ReviewDraftsPage as unknown as ComponentType<Record<string, unknown>>;
  const AnyReviewAllocationsPage = ReviewAllocationsPage as unknown as ComponentType<Record<string, unknown>>;
  const AnyMyAssignedReviewsPage = MyAssignedReviewsPage as unknown as ComponentType<Record<string, unknown>>;
  const AnyUsedReviewsPage = UsedReviewsPage as unknown as ComponentType<Record<string, unknown>>;
  const AnyReviewAnalyticsPage = ReviewAnalyticsPage as unknown as ComponentType<Record<string, unknown>>;
  const AnyReviewTemplatesPage = ReviewTemplatesPage as unknown as ComponentType<Record<string, unknown>>;
  const AnyReviewTemplateEditPage = ReviewTemplateEditPage as unknown as ComponentType<Record<string, unknown>>;
  const AnyReviewRequestsPage = ReviewRequestsPage as unknown as ComponentType<Record<string, unknown>>;

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
