import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { ContactBookManager } from "@/components/contact-book/contact-book-manager";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ContactBookPage() {
  let sessionUser;
  try {
    sessionUser = await requireUser();
  } catch {
    redirect("/login");
  }

  return (
    <DashboardLayout>
      <ContactBookManager isAdmin={sessionUser.role === "ADMIN"} />
    </DashboardLayout>
  );
}
