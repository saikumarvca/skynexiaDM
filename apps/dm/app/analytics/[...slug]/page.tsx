import { notFound } from "next/navigation";
import SocialAnalyticsPage from "@/app/dashboard/social-analytics/page";
import ReviewAnalyticsPage from "@/app/dashboard/review-analytics/page";

export default async function AnalyticsSlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const path = slug.join("/");
  if (path === "social") {
    return <SocialAnalyticsPage searchParams={searchParams} />;
  }
  if (path === "reviews") return <ReviewAnalyticsPage />;
  notFound();
}
