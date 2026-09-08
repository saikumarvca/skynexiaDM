import Link from "next/link";
import { redirect } from "next/navigation";
import mongoose from "mongoose";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCachedUser } from "@/lib/auth";
import { getCurrentUserTeamPermissions } from "@/lib/team/current-user-permissions";
import { hasAnyPermission } from "@/lib/team/require-permission";
import dbConnect from "@/lib/mongodb";
import Client from "@/models/Client";
import { isUnassignedClientLike } from "@/lib/reviews/unassigned-client";
import { ClientPortalAdmin, PreviewPortalButton } from "@/components/clients/client-portal-admin";

export const dynamic = "force-dynamic";

/**
 * Internal management page for one client's portal: preview it, publish
 * updates, control which activity the client sees, and list client logins.
 */
export default async function ClientPortalAdminPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const user = await getCachedUser();
  if (user.role !== "ADMIN") {
    const team = await getCurrentUserTeamPermissions();
    if (!hasAnyPermission(team.permissions, ["manage_clients"])) redirect(`/clients/${clientId}`);
  }

  if (!mongoose.isValidObjectId(clientId)) redirect("/clients");
  await dbConnect();
  const client = await Client.findById(clientId).select("name businessName email").lean();
  if (!client || isUnassignedClientLike(client)) redirect("/clients");
  const clientName = String(client.businessName ?? client.name ?? "");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Link
              href={`/clients/${clientId}`}
              className="mb-2 inline-block text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back to {clientName}
            </Link>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Client Portal</h1>
            <p className="text-muted-foreground">
              What {clientName} sees when they sign in, and what you publish to them.
            </p>
          </div>
          <PreviewPortalButton clientId={clientId} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Manage the portal</CardTitle>
            <CardDescription>
              Every action here is recorded in the admin audit log. Previews are read-only and never
              reveal or change the client&apos;s password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ClientPortalAdmin clientId={clientId} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
