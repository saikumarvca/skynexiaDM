import { notFound } from "next/navigation";
import NewContentPage from "@/app/dashboard/content/new/page";
import ScheduledPostsPage from "@/app/dashboard/scheduled-posts/page";
import NewScheduledPostPage from "@/app/dashboard/scheduled-posts/new/page";
import EditScheduledPostPage from "@/app/dashboard/scheduled-posts/[postId]/edit/page";

export default async function ContentSlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const path = slug.join("/");
  const AnyNewContentPage = NewContentPage as any;
  const AnyScheduledPostsPage = ScheduledPostsPage as any;
  const AnyNewScheduledPostPage = NewScheduledPostPage as any;
  const AnyEditScheduledPostPage = EditScheduledPostPage as any;

  if (path === "new") return <AnyNewContentPage searchParams={searchParams} />;
  if (path === "scheduled-posts") return <AnyScheduledPostsPage searchParams={searchParams} />;
  if (path === "scheduled-posts/new") return <AnyNewScheduledPostPage searchParams={searchParams} />;
  if (slug.length === 3 && slug[0] === "scheduled-posts" && slug[2] === "edit") {
    return (
      <AnyEditScheduledPostPage
        params={Promise.resolve({ postId: slug[1] })}
        searchParams={searchParams}
      />
    );
  }

  notFound();
}
