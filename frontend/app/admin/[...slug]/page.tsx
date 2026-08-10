import { notFound } from "next/navigation";
import AdminUsersPage from "@/app/dashboard/admin/users/page";
import AdminAuditLogPage from "@/app/dashboard/admin/audit-log/page";
import AdminWebhooksPage from "@/app/dashboard/admin/webhooks/page";
import AdminPartnerAgenciesPage from "@/app/dashboard/admin/partner-agencies/page";
import NewPartnerAgencyPage from "@/app/dashboard/admin/partner-agencies/new/page";
import PartnerAgencyDetailPage from "@/app/dashboard/admin/partner-agencies/[id]/page";
import EditPartnerAgencyPage from "@/app/dashboard/admin/partner-agencies/[id]/edit/page";
import PartnerAgencyEmployeesPage from "@/app/dashboard/admin/partner-agencies/[id]/employees/page";

export default async function AdminSlugPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const path = slug.join("/");
  if (path === "users") return <AdminUsersPage />;
  if (path === "audit-log") return <AdminAuditLogPage />;
  if (path === "webhooks") return <AdminWebhooksPage />;
  if (path === "partner-agencies") return <AdminPartnerAgenciesPage />;
  if (path === "partner-agencies/new") return <NewPartnerAgencyPage />;
  if (slug[0] === "partner-agencies" && slug[1] && slug[2] === "edit") {
    return <EditPartnerAgencyPage params={Promise.resolve({ id: slug[1] })} />;
  }
  if (slug[0] === "partner-agencies" && slug[1] && slug[2] === "employees") {
    return <PartnerAgencyEmployeesPage params={Promise.resolve({ id: slug[1] })} />;
  }
  if (slug[0] === "partner-agencies" && slug[1] && slug.length === 2) {
    return <PartnerAgencyDetailPage params={Promise.resolve({ id: slug[1] })} />;
  }
  notFound();
}
