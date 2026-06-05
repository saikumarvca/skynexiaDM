import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser, assertAdmin } from "@/lib/auth";
import { serverFetch } from "@/lib/server-fetch";
import { PartnerAgencyForm } from "@/components/team/PartnerAgencyForm";

type PartnerAgency = {
  _id: string;
  name: string;
  code?: string;
  status: "ACTIVE" | "INACTIVE";
  contactName?: string;
  contactEmail?: string;
  phone?: string;
  notes?: string;
};

async function getPartnerAgency(id: string) {
  const res = await serverFetch(`/api/partner-agencies/${id}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to load partner agency");
  return (await res.json()) as PartnerAgency;
}

export default async function EditPartnerAgencyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  assertAdmin(user);
  const { id } = await params;
  const item = await getPartnerAgency(id);
  if (!item) notFound();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Partner Agency</h1>
          <p className="text-muted-foreground">Update partner agency details.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Partner Agency Details</CardTitle>
          </CardHeader>
          <CardContent>
            <PartnerAgencyForm
              partnerAgencyId={id}
              initialData={{
                name: item.name,
                code: item.code,
                status: item.status,
                contactName: item.contactName,
                contactEmail: item.contactEmail,
                phone: item.phone,
                notes: item.notes,
              }}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
