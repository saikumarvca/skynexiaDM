import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamActivityFeed } from "@/components/team/TeamActivityFeed";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3152";

async function getActivity(params: {
  userId?: string;
  module?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
}) {
  const url = new URL(`${BASE}/api/team/activity`);
  if (params.userId) url.searchParams.set("userId", params.userId);
  if (params.module) url.searchParams.set("module", params.module);
  if (params.dateFrom) url.searchParams.set("dateFrom", params.dateFrom);
  if (params.dateTo) url.searchParams.set("dateTo", params.dateTo);
  url.searchParams.set("page", String(params.page ?? 1));
  url.searchParams.set("limit", "30");
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) return { items: [], total: 0, totalPages: 0 };
  return res.json();
}

async function getMembers() {
  const res = await fetch(`${BASE}/api/team/members?limit=100`, { cache: "no-store" });
  if (!res.ok) return { items: [] };
  const data = await res.json();
  return data.items || [];
}

interface PageProps {
  searchParams: Promise<{
    userId?: string;
    module?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function TeamActivityPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1"));
  const [activityData, members] = await Promise.all([
    getActivity({
      userId: params.userId,
      module: params.module,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      page,
    }),
    getMembers(),
  ]);

  const items = activityData.items || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Activity</h1>
          <p className="text-muted-foreground">
            Activity history and audit trail.
          </p>
        </div>

        <TeamActivityFeed
          items={items}
          members={members}
          currentParams={params}
          totalPages={activityData.totalPages ?? 1}
          total={activityData.total ?? 0}
        />
      </div>
    </DashboardLayout>
  );
}
