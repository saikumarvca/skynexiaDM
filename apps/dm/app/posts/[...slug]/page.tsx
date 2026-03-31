import { notFound } from "next/navigation";
import PostLikesPage from "@/app/dashboard/post-likes/page";
import PostSharesPage from "@/app/dashboard/post-shares/page";

export default async function PostsSlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const path = slug.join("/");
  const AnyPostLikesPage = PostLikesPage as any;
  const AnyPostSharesPage = PostSharesPage as any;

  if (path === "like") return <AnyPostLikesPage searchParams={searchParams} />;
  if (path === "share") return <AnyPostSharesPage searchParams={searchParams} />;

  notFound();
}
