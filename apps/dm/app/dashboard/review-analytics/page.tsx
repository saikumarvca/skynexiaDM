import { DashboardLayout } from "@/components/dashboard-layout";
import { StatsCard } from "@/components/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  CheckCircle,
  UserPlus,
  Share2,
  Upload,
  Archive,
} from "lucide-react";

import { serverFetch } from "@/lib/server-fetch";

async function getAnalytics() {
  try {
    const res = await serverFetch("/api/review-analytics");
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function ReviewAnalyticsPage() {
  const data = await getAnalytics();

  const totalDrafts = data?.totalDrafts ?? 0;
  const available = data?.available ?? 0;
  const allocated = data?.allocated ?? 0;
  const shared = data?.shared ?? 0;
  const used = data?.used ?? 0;
  const teamUsage = data?.teamUsage ?? [];
  const platformUsage = data?.platformUsage ?? [];
  const dailyTrend = data?.dailyTrend ?? [];
  const statusDistribution = data?.statusDistribution ?? {};

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Review Analytics</h1>
          <p className="text-muted-foreground">
            Overview of review drafts, allocations, and usage.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          <StatsCard
            title="Total Drafts"
            value={totalDrafts}
            icon={FileText}
            description="All review drafts"
          />
          <StatsCard
            title="Available"
            value={available}
            icon={CheckCircle}
            description="Ready to assign"
          />
          <StatsCard
            title="Allocated"
            value={allocated}
            icon={UserPlus}
            description="Assigned to team"
          />
          <StatsCard
            title="Shared"
            value={shared}
            icon={Share2}
            description="Shared with customer"
          />
          <StatsCard
            title="Posted"
            value={used}
            icon={Upload}
            description="Posted & used"
          />
          <StatsCard
            title="Archived"
            value={statusDistribution.Archived ?? 0}
            icon={Archive}
            description="Archived drafts"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Team-wise Usage</CardTitle>
            </CardHeader>
            <CardContent>
              {teamUsage.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data yet.</p>
              ) : (
                <div className="space-y-3">
                  {teamUsage.map(({ name, count }: { name: string; count: number }) => (
                    <div key={name} className="flex items-center justify-between">
                      <span className="font-medium">{name}</span>
                      <span className="text-muted-foreground">{count} used</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Platform-wise Usage</CardTitle>
            </CardHeader>
            <CardContent>
              {platformUsage.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data yet.</p>
              ) : (
                <div className="space-y-3">
                  {platformUsage.map(({ platform, count }: { platform: string; count: number }) => (
                    <div key={platform} className="flex items-center justify-between">
                      <span className="font-medium">{platform}</span>
                      <span className="text-muted-foreground">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(statusDistribution).map(([status, count]) => {
                const total = totalDrafts || 1;
                const pct = Math.round((Number(count) / total) * 100);
                return (
                  <div key={status}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{status}</span>
                      <span>{Number(count)} ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Posted Trend (Last 14 days)</CardTitle>
          </CardHeader>
          <CardContent>
            {dailyTrend.length === 0 ? (
              <p className="text-sm text-muted-foreground">No posted reviews yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Date</th>
                      <th className="text-right py-2">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyTrend.map(({ date, count }: { date: string; count: number }) => (
                      <tr key={date} className="border-b last:border-0">
                        <td className="py-2">{new Date(date).toLocaleDateString()}</td>
                        <td className="text-right py-2">{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
