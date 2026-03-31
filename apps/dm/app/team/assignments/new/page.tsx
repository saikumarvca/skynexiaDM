import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamAssignmentForm } from "@/components/team/TeamAssignmentForm";
import dbConnect from "@/lib/mongodb";
import TeamMember from "@/models/TeamMember";
import Agency from "@/models/Agency";

export const dynamic = "force-dynamic";

export default async function NewAssignmentPage() {
  await dbConnect();
  const docs = await TeamMember.find({ isDeleted: { $ne: true } })
    .select("name")
    .limit(100)
    .lean();
  const agencyDocs = await Agency.find({
    isDeleted: { $ne: true },
    type: "PARTNER",
    status: "ACTIVE",
  })
    .select("name")
    .limit(100)
    .lean();
  const members = docs.map((m) => JSON.parse(JSON.stringify(m)));
  const agencies = agencyDocs.map((a) => JSON.parse(JSON.stringify(a)));

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
            <TeamAssignmentForm members={members} agencies={agencies} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
