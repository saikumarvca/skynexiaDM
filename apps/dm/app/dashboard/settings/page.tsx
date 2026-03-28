import { DashboardLayout } from "@/components/dashboard-layout"

export const dynamic = "force-dynamic"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Users,
  Building2,
  Bell,
  Plug,
  Mail,
  Shield,
} from "lucide-react"
import dbConnect from "@/lib/mongodb"
import TeamMember from "@/models/TeamMember"

async function getTeamMembers(): Promise<{ _id: string; name: string; email: string; roleName?: string }[]> {
  try {
    await dbConnect()
    const items = await TeamMember.find({ status: "Active", isDeleted: { $ne: true } })
      .select("_id name email roleName")
      .limit(100)
      .lean()
    const plain = JSON.parse(JSON.stringify(items)) as {
      _id: string
      name: string
      email: string
      roleName?: string
    }[]
    return plain
  } catch (e) {
    console.error("Error fetching team members:", e)
    return []
  }
}

export default async function DashboardSettingsPage() {
  const teamMembers = await getTeamMembers()

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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team
              </CardTitle>
            </CardHeader>
            <CardContent>
              {teamMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No team members yet. Add members from Team → Members.
                </p>
              ) : (
                <ul className="space-y-3">
                  {teamMembers.map((u) => (
                    <li
                      key={u._id}
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-medium">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{u.name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {u.email}
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                        {u.roleName ?? "—"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
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
                Workspace name and default preferences can be configured here in a
                future update.
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
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security & access
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Password policies and role-based access controls will appear here
              when authentication is fully configured.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
