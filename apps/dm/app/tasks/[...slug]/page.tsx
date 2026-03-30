import { notFound } from "next/navigation";
import TaskNewPage from "@/app/dashboard/tasks/new/page";

export default async function TasksSlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const AnyTaskNewPage = TaskNewPage as any;
  if (slug.join("/") === "new") {
    return <AnyTaskNewPage searchParams={searchParams} />;
  }
  notFound();
}
