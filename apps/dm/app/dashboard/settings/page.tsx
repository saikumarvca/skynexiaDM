import { DashboardLayout } from "@/components/dashboard-layout";

export const dynamic = "force-dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Bell, Plug, Download, Package } from "lucide-react";
import dbConnect from "@/lib/mongodb";
import TeamMember from "@/models/TeamMember";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SettingsClient } from "@/components/settings/settings-client";
import { EmailConfigCard } from "@/components/settings/email-config-card";
import { SocialPlatformsCard } from "@/components/settings/social-platforms-card";
import { SettingsTeamCard } from "@/components/settings/settings-team-card";
import Link from "next/link";

async function getTeamMembers(isAdmin: boolean): Promise<
  { _id: string; name: string; email: string; roleName?: string }[]
> {
  try {
    await dbConnect();
    const query = isAdmin
      ? { isDeleted: { $ne: true } as const }
      : { status: "Active" as const, isDeleted: { $ne: true } as const };
    const items = await TeamMember.find(query)
      .select("_id name email roleName")
      .limit(100)
      .lean();
    const plain = JSON.parse(JSON.stringify(items)) as {
      _id: string;
      name: string;
      email: string;
      roleName?: string;
    }[];
    return plain;
  } catch (e) {
    console.error("Error fetching team members:", e);
    return [];
  }
}

export default async function DashboardSettingsPage() {
  let sessionUser;
  try {
    sessionUser = await requireUser();
  } catch {
    redirect("/login");
  }

  const isAdmin = sessionUser.role === "ADMIN";
  const teamMembers = await getTeamMembers(isAdmin);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Configure account, team, and workspace settings for your dashboard.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile + Change Password – interactive client component */}
          <SettingsClient
            initialName={sessionUser.name}
            email={sessionUser.email}
            role={sessionUser.role}
          />

          <SettingsTeamCard
            members={teamMembers}
            isAdmin={isAdmin}
            currentUserEmail={sessionUser.email}
          />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Item master
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Maintain reusable invoice line items. View usage and revenue
                analytics on the item master page.
              </p>
              <Link href="/dashboard/settings/item-master">
                <button
                  type="button"
                  className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  Manage item catalog
                </button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Workspace
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Application
                </p>
                <p className="font-medium">DM Dashboard</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Workspace name and default preferences can be configured here in
                a future update.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Email digests, task reminders, and lead alerts will be
                configurable here once notification preferences are available.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plug className="h-5 w-5" />
                Integrations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Connect Google Reviews, analytics, and other services from this
                section when integrations are enabled.
              </p>
            </CardContent>
          </Card>

          <EmailConfigCard isAdmin={sessionUser.role === "ADMIN"} />

          <SocialPlatformsCard />

          {sessionUser.role === "ADMIN" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Data Export
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Export all client data as JSON for backup or compliance
                  purposes.
                </p>
                <a href="/api/export/all-data" download="all-data-export.json">
                  <button className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground">
                    <Download className="h-4 w-4" />
                    Export all data
                  </button>
                </a>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
