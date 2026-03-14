import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AssignClientsForm } from "@/components/team/AssignClientsForm";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

async function getMember(id: string) {
  const res = await fetch(`${BASE}/api/team/members/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

async function getClients() {
  const res = await fetch(`${BASE}/api/clients?limit=500`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function AssignClientsPage({ params }: PageProps) {
  const { id } = await params;
  const [member, clients] = await Promise.all([getMember(id), getClients()]);

  if (!member) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Member Not Found</h1>
          <p className="text-muted-foreground">The requested member could not be found.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Assign Clients to {member.name}
          </h1>
          <p className="text-muted-foreground">
            Select which clients this team member is responsible for.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Assigned Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <AssignClientsForm
              memberId={id}
              memberName={member.name}
              initialClientIds={(member.assignedClientIds || []).map((c: { _id?: string } | string) =>
                typeof c === "string" ? c : c._id ?? ""
              )}
              clients={clients}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
