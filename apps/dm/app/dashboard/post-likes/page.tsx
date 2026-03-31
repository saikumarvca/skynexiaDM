import { SocialPostMetricsDashboard } from "@/components/social/social-post-metrics-dashboard";

interface PageProps {
  searchParams: Promise<{
    clientId?: string;
    platform?: string;
    sortBy?: string;
  }>;
}

export default async function PostLikesPage({ searchParams }: PageProps) {
  return (
    <SocialPostMetricsDashboard
      searchParams={searchParams}
      variant="likes"
      defaultSortBy="likes"
    />
  );
}
