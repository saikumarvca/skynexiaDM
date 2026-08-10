import { notFound } from "next/navigation";
import NewReportPage from "@/app/dashboard/reports/new/page";

export default async function ReportsSlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const AnyNewReportPage = NewReportPage as any;
  if (slug.join("/") === "new") return <AnyNewReportPage searchParams={searchParams} />;
  notFound();
}
