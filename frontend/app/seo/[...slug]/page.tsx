import { notFound } from "next/navigation";
import type { ComponentType } from "react";
import NewSeoPage from "@/app/dashboard/seo/new/page";
import CompetitorsPage from "@/app/dashboard/seo/competitors/page";

export default async function SeoSlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const path = slug.join("/");
  const AnyNewSeoPage = NewSeoPage as unknown as ComponentType<Record<string, unknown>>;
  const AnyCompetitorsPage = CompetitorsPage as unknown as ComponentType<Record<string, unknown>>;
  if (path === "new") return <AnyNewSeoPage searchParams={searchParams} />;
  if (path === "competitors") return <AnyCompetitorsPage searchParams={searchParams} />;
  notFound();
}
