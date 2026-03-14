import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamAssignmentForm } from "@/components/team/TeamAssignmentForm";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

async function getMembers() {
  const res = await fetch(`${BASE}/api/team/members?limit=100`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.items || [];
}

export const dynamic = "force-dynamic";

export default async function NewAssignmentPage() {
  const membersData = await getMembers();
const members = Array.isArray(membersData) ? membersData : [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Assignment</h1>
          <p className="text-muted-foreground">Assign work to a team member.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Assignment Details</CardTitle>
          </CardHeader>
          <CardContent>
            <TeamAssignmentForm members={members} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
