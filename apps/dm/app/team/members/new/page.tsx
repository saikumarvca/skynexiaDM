import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamMemberForm } from "@/components/team/TeamMemberForm";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

async function getRoles() {
  const res = await fetch(`${BASE}/api/team/roles?limit=100`, { cache: "no-store" });
  if (!res.ok) return { items: [] };
  const data = await res.json();
  return data;
}

export const dynamic = "force-dynamic";

export default async function NewMemberPage() {
  const rolesData = await getRoles();
  const roles = rolesData.items || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Team Member</h1>
          <p className="text-muted-foreground">
            Create a new team member.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Member Details</CardTitle>
          </CardHeader>
          <CardContent>
            <TeamMemberForm roles={roles} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
