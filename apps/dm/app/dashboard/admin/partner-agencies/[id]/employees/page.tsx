import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser, assertAdmin } from "@/lib/auth";
import { serverFetch } from "@/lib/server-fetch";

type Employee = {
  _id: string;
  name: string;
  email: string;
  accountType?: string;
  roleName?: string;
  department?: string;
  status: string;
};

async function getEmployees(id: string) {
  const res = await serverFetch(`/api/partner-agencies/${id}/employees`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load partner employees");
  const data = (await res.json()) as { items: Employee[] };
  return data.items ?? [];
}

export default async function PartnerAgencyEmployeesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  assertAdmin(user);
  const { id } = await params;
  const items = await getEmployees(id);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Partner Agency Employees
            </h1>
            <p className="text-muted-foreground">
              Employees linked to this partner agency.
            </p>
          </div>
          <Link href={`/admin/partner-agencies/${id}`}>
            <Button variant="outline">Back to details</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Employees ({items.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto rounded-md border">
              <table className="w-full min-w-[840px] text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Name</th>
                    <th className="px-3 py-2 text-left font-medium">Email</th>
                    <th className="px-3 py-2 text-left font-medium">Type</th>
                    <th className="px-3 py-2 text-left font-medium">Role</th>
                    <th className="px-3 py-2 text-left font-medium">Department</th>
                    <th className="px-3 py-2 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item._id} className="border-t">
                      <td className="px-3 py-2 font-medium">{item.name}</td>
                      <td className="px-3 py-2">{item.email}</td>
                      <td className="px-3 py-2">{item.accountType ?? "—"}</td>
                      <td className="px-3 py-2">{item.roleName ?? "—"}</td>
                      <td className="px-3 py-2">{item.department ?? "—"}</td>
                      <td className="px-3 py-2">{item.status}</td>
                    </tr>
                  ))}
                  {items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-3 py-8 text-center text-muted-foreground"
                      >
                        No employees found for this partner agency.
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
