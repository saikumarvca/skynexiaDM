import { notFound } from "next/navigation";
import OverviewPage from "@/app/dashboard/help/documentation/overview/page";
import ClientsPage from "@/app/dashboard/help/documentation/clients/page";
import CampaignsPage from "@/app/dashboard/help/documentation/campaigns/page";
import ContentPage from "@/app/dashboard/help/documentation/content/page";
import SeoPage from "@/app/dashboard/help/documentation/seo/page";
import LeadsPage from "@/app/dashboard/help/documentation/leads/page";
import TasksPage from "@/app/dashboard/help/documentation/tasks/page";
import ReviewsPage from "@/app/dashboard/help/documentation/reviews/page";
import TeamPage from "@/app/dashboard/help/documentation/team/page";
import AnalyticsHubPage from "@/app/dashboard/help/documentation/analytics-hub/page";
import SocialAnalyticsPage from "@/app/dashboard/help/documentation/social-analytics/page";
import ReportsPage from "@/app/dashboard/help/documentation/reports/page";
import InvoicesPage from "@/app/dashboard/help/documentation/invoices/page";
import TimeTrackingPage from "@/app/dashboard/help/documentation/time-tracking/page";
import IntegrationsPage from "@/app/dashboard/help/documentation/integrations/page";
import PortalPage from "@/app/dashboard/help/documentation/portal/page";
import AdminPage from "@/app/dashboard/help/documentation/admin/page";
import SettingsPage from "@/app/dashboard/help/documentation/settings/page";
import CronPage from "@/app/dashboard/help/documentation/cron/page";
import WorkflowsPage from "@/app/dashboard/help/documentation/workflows/page";

const TOPIC_COMPONENTS: Record<string, any> = {
  overview: OverviewPage,
  clients: ClientsPage,
  campaigns: CampaignsPage,
  content: ContentPage,
  seo: SeoPage,
  leads: LeadsPage,
  tasks: TasksPage,
  reviews: ReviewsPage,
  team: TeamPage,
  "analytics-hub": AnalyticsHubPage,
  "social-analytics": SocialAnalyticsPage,
  reports: ReportsPage,
  invoices: InvoicesPage,
  "time-tracking": TimeTrackingPage,
  integrations: IntegrationsPage,
  portal: PortalPage,
  admin: AdminPage,
  settings: SettingsPage,
  cron: CronPage,
  workflows: WorkflowsPage,
};

export default async function DocumentationTopicPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  if (slug.length !== 1) notFound();
  const topicId = slug[0];
  if (!topicId) notFound();
  const Component = TOPIC_COMPONENTS[topicId];
  if (!Component) notFound();
  return <Component />;
}
