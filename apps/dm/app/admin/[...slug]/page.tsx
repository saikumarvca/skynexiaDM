import { notFound } from "next/navigation";
import AdminUsersPage from "@/app/dashboard/admin/users/page";
import AdminAuditLogPage from "@/app/dashboard/admin/audit-log/page";
import AdminWebhooksPage from "@/app/dashboard/admin/webhooks/page";

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
  notFound();
}
