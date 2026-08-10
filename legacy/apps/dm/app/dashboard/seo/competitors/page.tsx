import { DashboardLayout } from "@/components/dashboard-layout";
import { CompetitorsPageClient } from "./competitors-page-client";

export default function CompetitorsPage() {
  return (
    <DashboardLayout>
      <CompetitorsPageClient />
    </DashboardLayout>
  );
}
