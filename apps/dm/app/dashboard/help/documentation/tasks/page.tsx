import { DashboardLayout } from "@/components/dashboard-layout";
import { DocumentationAppClient } from "../documentation-client";

export const dynamic = "force-dynamic";

export default function DocumentationTopicPage() {
  return (
    <DashboardLayout>
      <DocumentationAppClient topicId="tasks" />
    </DashboardLayout>
  );
}
