import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamRoleForm } from "@/components/team/TeamRoleForm";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3152";

async function getRole(id: string) {
  const res = await fetch(`${BASE}/api/team/roles/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function EditRolePage({ params }: PageProps) {
  const { id } = await params;
  const role = await getRole(id);

  if (!role) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Role Not Found</h1>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Role</h1>
          <p className="text-muted-foreground">Update role and permissions.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Role Details</CardTitle>
          </CardHeader>
          <CardContent>
            <TeamRoleForm
              roleId={id}
              initialData={{
                roleName: role.roleName,
                description: role.description,
                permissions: role.permissions || [],
              }}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
