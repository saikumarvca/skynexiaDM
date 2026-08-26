import { notFound } from "next/navigation";
import type { ComponentType } from "react";
import NewLeadPage from "@/app/dashboard/leads/new/page";

export default async function LeadsSlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const AnyNewLeadPage = NewLeadPage as unknown as ComponentType<Record<string, unknown>>;
  if (slug.join("/") === "new") return <AnyNewLeadPage searchParams={searchParams} />;
  notFound();
}
