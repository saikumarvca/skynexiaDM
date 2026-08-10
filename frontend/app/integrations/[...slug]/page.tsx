import { notFound } from "next/navigation";
import NewIntegrationPage from "@/app/dashboard/integrations/new/page";

export default async function IntegrationsSlugPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  if (slug.join("/") === "new") return <NewIntegrationPage />;
  notFound();
}
