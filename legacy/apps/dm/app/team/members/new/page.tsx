import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamMemberForm } from "@/components/team/TeamMemberForm";
import dbConnect from "@/lib/mongodb";
import TeamRole from "@/models/TeamRole";
import TeamMember from "@/models/TeamMember";
import PartnerAgency from "@/models/PartnerAgency";

export const dynamic = "force-dynamic";

export default async function NewMemberPage() {
  await dbConnect();
  const [roles, partnerAgencies, managers] = await Promise.all([
    TeamRole.find({ isDeleted: { $ne: true } })
      .sort({ roleName: 1 })
      .limit(100)
      .lean(),
    PartnerAgency.find({ isDeleted: { $ne: true }, status: "ACTIVE" })
      .sort({ name: 1 })
      .select("name")
      .lean(),
    TeamMember.find({ isDeleted: { $ne: true }, status: "Active" })
      .sort({ name: 1 })
      .select("name")
      .lean(),
  ]);
  const serializedRoles = roles.map((r) => JSON.parse(JSON.stringify(r)));
  const serializedAgencies = partnerAgencies.map((r) =>
    JSON.parse(JSON.stringify(r)),
  );
  const serializedManagers = managers.map((r) => JSON.parse(JSON.stringify(r)));

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
            <TeamMemberForm
              roles={serializedRoles}
              partnerAgencies={serializedAgencies}
              managers={serializedManagers}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
