import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser, assertAdmin } from "@/lib/auth";
import { serverFetch } from "@/lib/server-fetch";

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

type Employee = {
  _id: string;
  name: string;
  email: string;
  accountType?: string;
  roleName?: string;
  status: string;
};

async function getPartnerAgency(id: string) {
  const res = await serverFetch(`/api/partner-agencies/${id}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to load partner agency");
  return (await res.json()) as PartnerAgency;
}

async function getEmployees(id: string) {
  const res = await serverFetch(`/api/partner-agencies/${id}/employees`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load employees");
  const data = (await res.json()) as { items: Employee[] };
  return data.items ?? [];
}

export default async function PartnerAgencyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  assertAdmin(user);
  const { id } = await params;
  const [partnerAgency, employees] = await Promise.all([
    getPartnerAgency(id),
    getEmployees(id),
  ]);
  if (!partnerAgency) notFound();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{partnerAgency.name}</h1>
            <p className="text-muted-foreground">Partner agency details and members.</p>
          </div>
          <div className="flex gap-2">
            <Link href={`/admin/partner-agencies/${id}/edit`}>
              <Button variant="outline">Edit</Button>
            </Link>
            <Link href={`/admin/partner-agencies/${id}/employees`}>
              <Button>View employees</Button>
            </Link>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Code</p>
              <p>{partnerAgency.code ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p>{partnerAgency.status}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Contact name</p>
              <p>{partnerAgency.contactName ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Contact email</p>
              <p>{partnerAgency.contactEmail ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Phone</p>
              <p>{partnerAgency.phone ?? "—"}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs text-muted-foreground">Notes</p>
              <p>{partnerAgency.notes ?? "—"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Employees ({employees.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto rounded-md border">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Name</th>
                    <th className="px-3 py-2 text-left font-medium">Email</th>
                    <th className="px-3 py-2 text-left font-medium">Type</th>
                    <th className="px-3 py-2 text-left font-medium">Role</th>
                    <th className="px-3 py-2 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee._id} className="border-t">
                      <td className="px-3 py-2 font-medium">{employee.name}</td>
                      <td className="px-3 py-2">{employee.email}</td>
                      <td className="px-3 py-2">{employee.accountType ?? "—"}</td>
                      <td className="px-3 py-2">{employee.roleName ?? "—"}</td>
                      <td className="px-3 py-2">{employee.status}</td>
                    </tr>
                  ))}
                  {employees.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-3 py-6 text-center text-muted-foreground"
                      >
                        No employees assigned to this partner agency yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
