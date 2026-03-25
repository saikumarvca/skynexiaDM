import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamAssignmentForm } from "@/components/team/TeamAssignmentForm";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3152";

async function getAssignment(id: string) {
  const res = await fetch(`${BASE}/api/team/assignments/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

async function getMembers() {
  const res = await fetch(`${BASE}/api/team/members?limit=100`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.items || [];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function EditAssignmentPage({ params }: PageProps) {
  const { id } = await params;
  const [assignment, membersData] = await Promise.all([getAssignment(id), getMembers()]);
const members = Array.isArray(membersData) ? membersData : [];

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
