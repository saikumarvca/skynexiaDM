import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamMemberForm } from "@/components/team/TeamMemberForm";
import dbConnect from "@/lib/mongodb";
import TeamMember from "@/models/TeamMember";
import TeamRole from "@/models/TeamRole";

export const dynamic = "force-dynamic";

interface PageProps { params: Promise<{ id: string }>; }

export default async function EditMemberPage({ params }: PageProps) {
  const { id } = await params;
  await dbConnect();
  const [memberDoc, roles] = await Promise.all([
    TeamMember.findById(id).lean(),
    TeamRole.find({ isDeleted: { $ne: true } }).sort({ roleName: 1 }).limit(100).lean(),
  ]);
  const member = memberDoc ? JSON.parse(JSON.stringify(memberDoc)) : null;
  const rolesList = roles.map((r) => JSON.parse(JSON.stringify(r)));

  if (!member) {
    return <DashboardLayout><div className="space-y-6"><h1 className="text-3xl font-bold">Member Not Found</h1><p className="text-muted-foreground">The requested member could not be found.</p></div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Member</h1>
          <p className="text-muted-foreground">Update team member details.</p>
        </div>
        <Card>
          <CardHeader><CardTitle>Member Details</CardTitle></CardHeader>
          <CardContent>
            <TeamMemberForm memberId={id} initialData={{ name: member.name, email: member.email, phone: member.phone, roleId: member.roleId?._id ?? member.roleId ?? "", department: member.department, notes: member.notes }} roles={rolesList} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
