import { DashboardLayout } from "@/components/dashboard-layout";
import { StatsCard } from "@/components/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  UserCheck,
  ClipboardList,
  CheckCircle,
  FileText,
  Loader2,
  Activity,
  Users2,
  Link2,
} from "lucide-react";
import { SeedDataButton } from "@/components/team/SeedDataButton";
import Link from "next/link";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3152";

interface TeamOverviewStats {
  totalMembers: number;
  activeMembers: number;
  openAssignments: number;
  completedAssignments: number;
  pendingReviewsAssigned: number;
  averageWorkload: number;
  tasksCompletedThisWeek: number;
}

async function getTeamStats(): Promise<TeamOverviewStats> {
  try {
    const res = await fetch(`${BASE}/api/team/stats`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch stats");
    return res.json();
  } catch (error) {
    console.error("Error fetching team stats:", error);
    return {
      totalMembers: 0,
      activeMembers: 0,
      openAssignments: 0,
      completedAssignments: 0,
      pendingReviewsAssigned: 0,
      averageWorkload: 0,
      tasksCompletedThisWeek: 0,
    };
  }
}

async function getPerformanceData(): Promise<{
  overloaded: { memberName: string; memberId: string }[];
  available: { memberName: string; memberId: string }[];
  recentlyActive: { memberName: string; userId: string }[];
}> {
  try {
    const [perfRes, activityRes] = await Promise.all([
      fetch(`${BASE}/api/team/performance`, { cache: "no-store" }),
      fetch(`${BASE}/api/team/activity?limit=10&page=1`, { cache: "no-store" }),
    ]);

    const perf = perfRes.ok ? await perfRes.json() : { items: [] };
    const activity = activityRes.ok ? await activityRes.json() : { items: [] };

    const overloaded = (perf.items || []).filter(
      (m: { workloadStatus: string }) => m.workloadStatus === "Overloaded"
    );
    const available = (perf.items || []).filter(
      (m: { workloadStatus: string }) => m.workloadStatus === "Available"
    );
    const seenUsers = new Set<string>();
    const recentlyActive = (activity.items || [])
      .filter((a: { userId: string }) => {
        if (seenUsers.has(a.userId)) return false;
        seenUsers.add(a.userId);
        return true;
      })
      .slice(0, 5)
      .map((a: { userName: string; userId: string }) => ({
        memberName: a.userName,
        userId: a.userId,
      }));

    return {
      overloaded: overloaded.map((m: { memberName: string; memberId: string }) => ({
        memberName: m.memberName,
        memberId: m.memberId,
      })),
      available: available.map((m: { memberName: string; memberId: string }) => ({
        memberName: m.memberName,
        memberId: m.memberId,
      })),
      recentlyActive,
    };
  } catch (error) {
    console.error("Error fetching performance/activity:", error);
    return { overloaded: [], available: [], recentlyActive: [] };
  }
}

async function getRecentActivity() {
  try {
    const res = await fetch(`${BASE}/api/team/activity?limit=5&page=1`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items || [];
  } catch {
    return [];
  }
}

export const dynamic = "force-dynamic";

export default async function TeamOverviewPage() {
  const [stats, performanceData, recentActivity] = await Promise.all([
    getTeamStats(),
    getPerformanceData(),
    getRecentActivity(),
  ]);

  const quickLinks = [
    { href: "/team/members", label: "Members", icon: Users },
    { href: "/team/roles", label: "Roles", icon: Users2 },
    { href: "/team/assignments", label: "Assignments", icon: ClipboardList },
    { href: "/team/performance", label: "Performance", icon: Activity },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Team Overview</h1>
            <p className="text-muted-foreground">
              Manage internal users, assignments, permissions, and workload.
            </p>
          </div>
          <SeedDataButton />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <StatsCard
            title="Total Members"
            value={stats.totalMembers}
            icon={Users}
            description="Team size"
          />
          <StatsCard
            title="Active Members"
            value={stats.activeMembers}
            icon={UserCheck}
            description="Currently active"
          />
          <StatsCard
            title="Open Assignments"
            value={stats.openAssignments}
            icon={ClipboardList}
            description="Pending work"
          />
          <StatsCard
            title="Completed"
            value={stats.completedAssignments}
            icon={CheckCircle}
            description="Done assignments"
          />
          <StatsCard
            title="Pending Reviews"
            value={stats.pendingReviewsAssigned}
            icon={FileText}
            description="Review allocations"
          />
          <StatsCard
            title="Avg Workload"
            value={stats.averageWorkload}
            icon={Loader2}
            description="Open per member"
          />
          <StatsCard
            title="Tasks This Week"
            value={stats.tasksCompletedThisWeek}
            icon={CheckCircle}
            description="Completed tasks"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recently Active</CardTitle>
            </CardHeader>
            <CardContent>
              {performanceData.recentlyActive.length > 0 ? (
                <ul className="space-y-2">
                  {performanceData.recentlyActive.map((m) => (
                    <li key={m.userId}>
                      <Link
                        href={`/team/performance?memberId=${m.userId}`}
                        className="text-primary hover:underline"
                      >
                        {m.memberName}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Overloaded</CardTitle>
            </CardHeader>
            <CardContent>
              {performanceData.overloaded.length > 0 ? (
                <ul className="space-y-2">
                  {performanceData.overloaded.map((m) => (
                    <li key={m.memberId}>
                      <Link
                        href={`/team/workload`}
                        className="text-amber-600 hover:underline"
                      >
                        {m.memberName}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">None</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Available</CardTitle>
            </CardHeader>
            <CardContent>
              {performanceData.available.length > 0 ? (
                <ul className="space-y-2">
                  {performanceData.available.slice(0, 5).map((m) => (
                    <li key={m.memberId}>
                      <Link
                        href={`/team/workload`}
                        className="text-green-600 hover:underline"
                      >
                        {m.memberName}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">None</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4" />
                Recent Team Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <ul className="space-y-2 text-sm">
                  {recentActivity.map((a: { _id: string; userName: string; action: string; targetName?: string; createdAt: string }) => (
                    <li key={a._id} className="flex justify-between gap-2">
                      <span>
                        <strong>{a.userName}</strong> {a.action}
                        {a.targetName && `: ${a.targetName}`}
                      </span>
                      <span className="shrink-0 text-muted-foreground">
                        {new Date(a.createdAt).toLocaleDateString()}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No activity yet</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Link2 className="h-4 w-4" />
                Quick Links
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2">
                {quickLinks.map((q) => (
                  <Link
                    key={q.href}
                    href={q.href}
                    className="flex items-center gap-2 rounded-md border px-4 py-2 text-sm hover:bg-muted/50"
                  >
                    <q.icon className="h-4 w-4" />
                    {q.label}
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
