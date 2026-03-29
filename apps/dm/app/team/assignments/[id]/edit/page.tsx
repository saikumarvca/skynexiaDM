import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamAssignmentForm } from "@/components/team/TeamAssignmentForm";
import dbConnect from "@/lib/mongodb";
import TeamAssignment from "@/models/TeamAssignment";
import TeamMember from "@/models/TeamMember";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditAssignmentPage({ params }: PageProps) {
  const { id } = await params;
  await dbConnect();
  const [doc, memberDocs] = await Promise.all([
    TeamAssignment.findById(id).lean(),
    TeamMember.find({ isDeleted: { $ne: true } })
      .select("name")
      .limit(100)
      .lean(),
  ]);
  const assignment = doc ? JSON.parse(JSON.stringify(doc)) : null;
  const members = memberDocs.map((m) => JSON.parse(JSON.stringify(m)));

  if (!assignment) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Assignment Not Found</h1>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Assignment</h1>
          <p className="text-muted-foreground">Update assignment details.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Assignment Details</CardTitle>
          </CardHeader>
          <CardContent>
            <TeamAssignmentForm
              assignmentId={id}
              initialData={{
                title: assignment.title,
                description: assignment.description,
                assignmentType: assignment.assignmentType,
                sourceModule: assignment.sourceModule,
                referenceId: assignment.referenceId,
                assignedToUserId: assignment.assignedToUserId,
                assignedByUserId: assignment.assignedByUserId,
                status: assignment.status,
                priority: assignment.priority,
                dueDate: assignment.dueDate
                  ? new Date(assignment.dueDate).toISOString().slice(0, 10)
                  : "",
                notes: assignment.notes,
              }}
              members={members}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
