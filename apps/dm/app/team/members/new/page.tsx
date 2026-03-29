import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamMemberForm } from "@/components/team/TeamMemberForm";
import dbConnect from "@/lib/mongodb";
import TeamRole from "@/models/TeamRole";

export const dynamic = "force-dynamic";

export default async function NewMemberPage() {
  await dbConnect();
  const roles = (
    await TeamRole.find({ isDeleted: { $ne: true } })
      .sort({ roleName: 1 })
      .limit(100)
      .lean()
  ).map((r) => JSON.parse(JSON.stringify(r)));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Team Member</h1>
          <p className="text-muted-foreground">Create a new team member.</p>
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
