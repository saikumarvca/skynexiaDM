import { SocialPostMetricsDashboard } from "@/components/social/social-post-metrics-dashboard";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SocialAnalyticsPage({ searchParams }: PageProps) {
  return (
    <SocialPostMetricsDashboard searchParams={searchParams} variant="full" />
  );
}
