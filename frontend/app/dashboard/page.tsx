import { Suspense } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Client } from "@/types";
import dbConnect from "@/lib/mongodb";
import ClientModel from "@/models/Client";
import { getCachedUser } from "@/lib/auth";
import { getDashboardPageData } from "@/lib/dashboard/page-data";
import { getCurrentUserTeamPermissions } from "@/lib/team/current-user-permissions";
import { WelcomeAccessPanel } from "@/components/access/welcome-access-panel";

export const dynamic = "force-dynamic";

async function getRecentClients(): Promise<Client[]> {
  await dbConnect();
  return ClientModel.find({ status: { $ne: "ARCHIVED" } })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean() as unknown as Client[];
}

function DashboardFallback() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-40 rounded-2xl bg-muted/60" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-xl bg-muted/60" />
        ))}
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const user = await getCachedUser();
  const isAdmin = user.role === "ADMIN";
  const team = await getCurrentUserTeamPermissions();
  const hasDashboardAccess =
    isAdmin || team.permissions.includes("view_dashboard");

  if (!hasDashboardAccess) {
    return (
      <DashboardLayout>
        <WelcomeAccessPanel
          userName={user.name}
          isAdmin={isAdmin}
          permissions={team.permissions}
        />
      </DashboardLayout>
    );
  }

  const [data, recentClients] = await Promise.all([
    getDashboardPageData({ isAdmin }),
    getRecentClients(),
  ]);

  const recentForUi = recentClients.map((c) => ({
    _id: String(c._id),
    name: c.name,
    businessName: c.businessName,
    createdAt:
      typeof c.createdAt === "string"
        ? c.createdAt
        : new Date(c.createdAt).toISOString(),
  }));

  return (
    <DashboardLayout>
      <Suspense fallback={<DashboardFallback />}>
        <DashboardShell
          data={data}
          recentClients={recentForUi}
          userName={user.name}
          isAdmin={isAdmin}
        />
      </Suspense>
    </DashboardLayout>
  );
}
