import { notFound } from "next/navigation";
import type { ComponentType } from "react";
import NewReportPage from "@/app/dashboard/reports/new/page";

export default async function ReportsSlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const AnyNewReportPage = NewReportPage as unknown as ComponentType<Record<string, unknown>>;
  if (slug.join("/") === "new") return <AnyNewReportPage searchParams={searchParams} />;
  notFound();
}
