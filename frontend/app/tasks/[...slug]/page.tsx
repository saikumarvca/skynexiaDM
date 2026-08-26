import { notFound } from "next/navigation";
import type { ComponentType } from "react";
import TaskNewPage from "@/app/dashboard/tasks/new/page";

export default async function TasksSlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const AnyTaskNewPage = TaskNewPage as unknown as ComponentType<Record<string, unknown>>;
  if (slug.join("/") === "new") {
    return <AnyTaskNewPage searchParams={searchParams} />;
  }
  notFound();
}
