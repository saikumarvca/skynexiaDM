import { notFound } from "next/navigation";
import ItemMasterPage from "@/app/dashboard/settings/item-master/page";

export default async function SettingsSlugPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  if (slug.join("/") === "item-master") return <ItemMasterPage />;
  notFound();
}
