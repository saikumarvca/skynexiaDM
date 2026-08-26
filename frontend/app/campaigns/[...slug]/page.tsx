import { notFound } from "next/navigation";
import type { ComponentType } from "react";
import NewCampaignPage from "@/app/dashboard/campaigns/new/page";
import BudgetPacingPage from "@/app/dashboard/budget-pacing/page";

export default async function CampaignsSlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const path = slug.join("/");
  const sp = await searchParams;
  const AnyNewCampaignPage = NewCampaignPage as unknown as ComponentType<Record<string, unknown>>;
  if (path === "new") return <AnyNewCampaignPage searchParams={Promise.resolve(sp)} />;
  if (path === "budget-pacing") return <BudgetPacingPage />;
  notFound();
}
