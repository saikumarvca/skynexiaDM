import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamMemberForm } from "@/components/team/TeamMemberForm";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3152";

async function getMember(id: string) {
  const res = await fetch(`${BASE}/api/team/members/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

async function getRoles() {
  const res = await fetch(`${BASE}/api/team/roles?limit=100`, { cache: "no-store" });
  if (!res.ok) return { items: [] };
  const data = await res.json();
  return data;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function EditMemberPage({ params }: PageProps) {
  const { id } = await params;
  const [member, rolesData] = await Promise.all([getMember(id), getRoles()]);
  const roles = rolesData.items || [];

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
          <h1 className="text-3xl font-bold tracking-tight">Edit Member</h1>
          <p className="text-muted-foreground">Update team member details.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Member Details</CardTitle>
          </CardHeader>
          <CardContent>
            <TeamMemberForm
              memberId={id}
              initialData={{
                name: member.name,
                email: member.email,
                phone: member.phone,
                roleId: member.roleId?._id ?? member.roleId ?? "",
                department: member.department,
                notes: member.notes,
              }}
              roles={roles}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
