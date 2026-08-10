import { notFound } from "next/navigation";
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
  const AnyNewSeoPage = NewSeoPage as any;
  const AnyCompetitorsPage = CompetitorsPage as any;
  if (path === "new") return <AnyNewSeoPage searchParams={searchParams} />;
  if (path === "competitors") return <AnyCompetitorsPage searchParams={searchParams} />;
  notFound();
}
