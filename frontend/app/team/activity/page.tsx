import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamActivityFeed } from "@/components/team/TeamActivityFeed";
import dbConnect from "@/lib/mongodb";
import TeamActivityLog from "@/models/TeamActivityLog";
import TeamMember from "@/models/TeamMember";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    userId?: string;
    module?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: string;
  }>;
}

export default async function TeamActivityPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1"));
  const limit = 30;
  await dbConnect();

  const query: Record<string, unknown> = {};
  if (params.userId) query.userId = params.userId;
  if (params.module) query.module = params.module;
  if (params.dateFrom || params.dateTo) {
    query.createdAt = {};
    if (params.dateFrom)
      (query.createdAt as Record<string, unknown>).$gte = new Date(
        params.dateFrom,
      );
    if (params.dateTo)
      (query.createdAt as Record<string, unknown>).$lte = new Date(
        params.dateTo + "T23:59:59.999Z",
      );
  }

  const [items, total, memberDocs] = await Promise.all([
    TeamActivityLog.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    TeamActivityLog.countDocuments(query),
    TeamMember.find({ isDeleted: { $ne: true } })
      .select("name")
      .limit(100)
      .lean(),
  ]);

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
          items={items.map((i) => JSON.parse(JSON.stringify(i)))}
          members={memberDocs.map((m) => JSON.parse(JSON.stringify(m)))}
          currentParams={params}
          totalPages={Math.ceil(total / limit)}
          total={total}
        />
      </div>
    </DashboardLayout>
  );
}
