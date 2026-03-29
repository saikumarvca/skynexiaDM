import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard-layout";
import { StatsCard } from "@/components/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WorkloadBadge } from "@/components/team/WorkloadBadge";
import { TrendingUp, Users, BarChart3 } from "lucide-react";
import { getPerformanceMetrics } from "@/lib/team/performance";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ memberId?: string; department?: string }>;
}

export default async function TeamPerformancePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const items = await getPerformanceMetrics(params);

  const topPerformers = [...items]
    .sort((a, b) => (b.completionRate ?? 0) - (a.completionRate ?? 0))
    .filter((m) => (m.completed ?? 0) > 0)
    .slice(0, 5);
  const lowActivity = [...items]
    .sort((a, b) => (a.completed ?? 0) - (b.completed ?? 0))
    .slice(0, 5);
  const avgCompletion =
    items.length > 0
      ? Math.round(
          items.reduce((s, m) => s + (m.completionRate ?? 0), 0) / items.length,
        )
      : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Team Performance
          </h1>
          <p className="text-muted-foreground">
            Track productivity and contribution per team member.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <StatsCard
            title="Users"
            value={items.length}
            icon={Users}
            description="In scope"
          />
          <StatsCard
            title="Avg Completion Rate"
            value={`${avgCompletion}%`}
            icon={BarChart3}
            description="Across team"
          />
          <StatsCard
            title="Top Performers"
            value={topPerformers.length}
            icon={TrendingUp}
            description="With completed work"
          />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Performance Table</CardTitle>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-muted-foreground">
                No performance data. Add team members and assignments.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>Pending</TableHead>
                      <TableHead>Overdue</TableHead>
                      <TableHead>Completion %</TableHead>
                      <TableHead>Review Assignments</TableHead>
                      <TableHead>Workload</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((m) => (
                      <TableRow key={m.memberId}>
                        <TableCell>
                          <Link
                            href="/team/workload"
                            className="font-medium text-primary hover:underline"
                          >
                            {m.memberName}
                          </Link>
                        </TableCell>
                        <TableCell>{m.department ?? "—"}</TableCell>
                        <TableCell>{m.totalAssigned}</TableCell>
                        <TableCell>{m.completed}</TableCell>
                        <TableCell>{m.pending}</TableCell>
                        <TableCell>{m.overdue}</TableCell>
                        <TableCell>{m.completionRate}%</TableCell>
                        <TableCell>{m.reviewAssignmentsCompleted}</TableCell>
                        <TableCell>
                          <WorkloadBadge
                            status={
                              m.workloadStatus as
                                | "Available"
                                | "Balanced"
                                | "Busy"
                                | "Overloaded"
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
            </CardHeader>
            <CardContent>
              {topPerformers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No completed work yet
                </p>
              ) : (
                <ul className="space-y-2">
                  {topPerformers.map((m) => (
                    <li key={m.memberName} className="flex justify-between">
                      <span>{m.memberName}</span>
                      <span className="text-muted-foreground">
                        {m.completionRate}%
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Low Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {lowActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data</p>
              ) : (
                <ul className="space-y-2">
                  {lowActivity.map((m) => (
                    <li key={m.memberName} className="flex justify-between">
                      <span>{m.memberName}</span>
                      <span className="text-muted-foreground">
                        {m.completed} completed
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
