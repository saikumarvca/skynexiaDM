import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamRoleForm } from "@/components/team/TeamRoleForm";
import dbConnect from "@/lib/mongodb";
import TeamRole from "@/models/TeamRole";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditRolePage({ params }: PageProps) {
  const { id } = await params;
  await dbConnect();
  const doc = await TeamRole.findById(id).lean();
  const role = doc ? JSON.parse(JSON.stringify(doc)) : null;

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
