import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser, assertAdmin } from "@/lib/auth";
import { PartnerAgencyForm } from "@/components/team/PartnerAgencyForm";

export default async function NewPartnerAgencyPage() {
  const user = await requireUser();
  assertAdmin(user);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Partner Agency</h1>
          <p className="text-muted-foreground">Add a new partner organization.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Partner Agency Details</CardTitle>
          </CardHeader>
          <CardContent>
            <PartnerAgencyForm />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
