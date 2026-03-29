import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamRoleForm } from "@/components/team/TeamRoleForm";

export const dynamic = "force-dynamic";

export default function NewRolePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Role</h1>
          <p className="text-muted-foreground">
            Create a new role with permissions.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Role Details</CardTitle>
          </CardHeader>
          <CardContent>
            <TeamRoleForm />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
