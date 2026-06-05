import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard-layout";
import { requireUser, assertAdmin } from "@/lib/auth";
import { serverFetch } from "@/lib/server-fetch";
import { Button } from "@/components/ui/button";

type PartnerAgencyRow = {
  _id: string;
  name: string;
  code?: string;
  status: "ACTIVE" | "INACTIVE";
  contactName?: string;
  contactEmail?: string;
  updatedAt: string;
};

async function getPartnerAgencies() {
  const res = await serverFetch("/api/partner-agencies", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load partner agencies");
  const data = (await res.json()) as { items: PartnerAgencyRow[] };
  return data.items ?? [];
}

export default async function AdminPartnerAgenciesPage() {
  const user = await requireUser();
  assertAdmin(user);
  const items = await getPartnerAgencies();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Partner Agencies</h1>
            <p className="text-muted-foreground">
              Manage partner organizations and their employees.
            </p>
          </div>
          <Link href="/admin/partner-agencies/new">
            <Button>Create partner agency</Button>
          </Link>
        </div>

        <div className="overflow-auto rounded-md border">
          <table className="min-w-[920px] w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Name</th>
                <th className="px-3 py-2 text-left font-medium">Code</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
                <th className="px-3 py-2 text-left font-medium">Contact</th>
                <th className="px-3 py-2 text-left font-medium">Updated</th>
                <th className="px-3 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id} className="border-t">
                  <td className="px-3 py-2 font-medium">{item.name}</td>
                  <td className="px-3 py-2">{item.code ?? "—"}</td>
                  <td className="px-3 py-2">{item.status}</td>
                  <td className="px-3 py-2">
                    {item.contactName || item.contactEmail
                      ? `${item.contactName ?? "—"} / ${item.contactEmail ?? "—"}`
                      : "—"}
                  </td>
                  <td className="px-3 py-2">
                    {new Date(item.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Link
                      href={`/admin/partner-agencies/${item._id}`}
                      className="text-primary hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                    No partner agencies found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
