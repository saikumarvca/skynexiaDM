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
    const sp = await searchParams;
    const clientId =
      typeof sp.clientId === "string" ? sp.clientId : undefined;
    const platform = typeof sp.platform === "string" ? sp.platform : undefined;
    return (
      <SocialAnalyticsPage
        searchParams={Promise.resolve({ clientId, platform })}
      />
    );
  }
  if (path === "reviews") return <ReviewAnalyticsPage />;
  notFound();
}
