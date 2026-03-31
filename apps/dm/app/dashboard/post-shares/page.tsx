import { SocialPostMetricsDashboard } from "@/components/social/social-post-metrics-dashboard";

interface PageProps {
  searchParams: Promise<{
    clientId?: string;
    platform?: string;
    sortBy?: string;
  }>;
}

export default async function PostSharesPage({ searchParams }: PageProps) {
  return (
    <SocialPostMetricsDashboard
      searchParams={searchParams}
      variant="shares"
      defaultSortBy="shares"
    />
  );
}
