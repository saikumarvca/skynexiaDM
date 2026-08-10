import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { requireUser, assertAdmin } from "@/lib/auth";
import { AuditLogClient } from "@/components/admin/audit-log-client";
import dbConnect from "@/lib/mongodb";
import ReviewActivityLog from "@/models/ReviewActivityLog";
import TeamActivityLog from "@/models/TeamActivityLog";

export const dynamic = "force-dynamic";

async function getAuditLogs() {
  await dbConnect();

  const [reviewLogs, teamLogs] = await Promise.all([
    ReviewActivityLog.find({}).sort({ performedAt: -1 }).limit(500).lean(),
    TeamActivityLog.find({}).sort({ createdAt: -1 }).limit(500).lean(),
  ]);

  const reviewSerialized = JSON.parse(JSON.stringify(reviewLogs));
  const teamSerialized = JSON.parse(JSON.stringify(teamLogs));

  return { reviewLogs: reviewSerialized, teamLogs: teamSerialized };
}

export default async function AuditLogPage() {
  let user;
  try {
    user = await requireUser();
  } catch {
    redirect("/login");
  }

  try {
    assertAdmin(user);
  } catch {
    redirect("/dashboard");
  }

  const { reviewLogs, teamLogs } = await getAuditLogs();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
          <p className="text-muted-foreground">
            View all review and team activity across the system.
          </p>
        </div>
        <AuditLogClient reviewLogs={reviewLogs} teamLogs={teamLogs} />
      </div>
    </DashboardLayout>
  );
}
