import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AssignClientsForm } from "@/components/team/AssignClientsForm";
import dbConnect from "@/lib/mongodb";
import TeamMember from "@/models/TeamMember";
import ClientModel from "@/models/Client";

export const dynamic = "force-dynamic";

interface PageProps { params: Promise<{ id: string }>; }

export default async function AssignClientsPage({ params }: PageProps) {
  const { id } = await params;
  await dbConnect();
  const [memberDoc, clientDocs] = await Promise.all([
    TeamMember.findById(id).lean(),
    ClientModel.find({}).sort({ businessName: 1 }).limit(500).lean(),
  ]);
  const member = memberDoc ? JSON.parse(JSON.stringify(memberDoc)) : null;
  const clients = clientDocs.map((c) => JSON.parse(JSON.stringify(c)));

  if (!member) {
    return <DashboardLayout><div className="space-y-6"><h1 className="text-3xl font-bold">Member Not Found</h1><p className="text-muted-foreground">The requested member could not be found.</p></div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assign Clients to {member.name}</h1>
          <p className="text-muted-foreground">Select which clients this team member is responsible for.</p>
        </div>
        <Card>
          <CardHeader><CardTitle>Assigned Clients</CardTitle></CardHeader>
          <CardContent>
            <AssignClientsForm memberId={id} memberName={member.name} initialClientIds={(member.assignedClientIds || []).map((c: { _id?: string } | string) => typeof c === "string" ? c : c._id ?? "")} clients={clients} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
