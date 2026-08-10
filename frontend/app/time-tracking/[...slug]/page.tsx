import { notFound } from "next/navigation";
import NewTimeEntryPage from "@/app/dashboard/time-tracking/new/page";

export default async function TimeTrackingSlugPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  if (slug.join("/") === "new") return <NewTimeEntryPage />;
  notFound();
}
