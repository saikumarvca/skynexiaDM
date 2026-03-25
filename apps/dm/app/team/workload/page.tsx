import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard-layout";
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

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3152";

async function getPerformance() {
  const res = await fetch(`${BASE}/api/team/performance`, { cache: "no-store" });
  if (!res.ok) return { items: [] };
  const data = await res.json();
  return data;
}

export const dynamic = "force-dynamic";

export default async function TeamWorkloadPage() {
  const perf = await getPerformance();
  const items = perf.items || [];

  const overloaded = items.filter((m: { workloadStatus: string }) => m.workloadStatus === "Overloaded");
  const available = items.filter((m: { workloadStatus: string }) => m.workloadStatus === "Available");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Workload</h1>
          <p className="text-muted-foreground">
            Workload distribution across team members.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Overloaded</CardTitle>
            </CardHeader>
            <CardContent>
              {overloaded.length === 0 ? (
                <p className="text-muted-foreground">No overloaded members</p>
              ) : (
                <ul className="space-y-2">
                  {overloaded.map((m: { memberName: string; openAssignments: number }) => (
                    <li key={m.memberName}>
                      <Link href="/team/assignments" className="text-amber-600 hover:underline">
                        {m.memberName}
                      </Link>
                      <span className="ml-2 text-sm text-muted-foreground">
                        {m.openAssignments} open
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Available</CardTitle>
            </CardHeader>
            <CardContent>
              {available.length === 0 ? (
                <p className="text-muted-foreground">No available members</p>
              ) : (
                <ul className="space-y-2">
                  {available.map((m: { memberName: string; openAssignments: number }) => (
                    <li key={m.memberName}>
                      <Link href="/team/assignments" className="text-green-600 hover:underline">
                        {m.memberName}
                      </Link>
                      <span className="ml-2 text-sm text-muted-foreground">
                        {m.openAssignments} open
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Workload Details</CardTitle>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-muted-foreground">No team members. Seed data first.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Open</TableHead>
                      <TableHead>Urgent</TableHead>
                      <TableHead>Due Soon</TableHead>
                      <TableHead>Workload Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((m: {
                      memberId: string;
                      memberName: string;
                      openAssignments: number;
                      urgentCount: number;
                      dueSoonCount: number;
                      workloadStatus: string;
                    }) => (
                      <TableRow key={m.memberId}>
                        <TableCell>
                          <Link
                            href="/team/assignments"
                            className="font-medium text-primary hover:underline"
                          >
                            {m.memberName}
                          </Link>
                        </TableCell>
                        <TableCell>{m.openAssignments}</TableCell>
                        <TableCell>{m.urgentCount}</TableCell>
                        <TableCell>{m.dueSoonCount}</TableCell>
                        <TableCell>
                          <WorkloadBadge status={m.workloadStatus as "Available" | "Balanced" | "Busy" | "Overloaded"} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
