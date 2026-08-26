import { notFound } from "next/navigation";
import type { ComponentType } from "react";
import ChannelSubscribesPage from "@/app/dashboard/channel-subscribes/page";

export default async function ChannelsSlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const path = slug.join("/");
  const AnyChannelSubscribesPage = ChannelSubscribesPage as unknown as ComponentType<Record<string, unknown>>;

  if (path === "subscribe")
    return <AnyChannelSubscribesPage searchParams={searchParams} />;

  notFound();
}
