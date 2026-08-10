import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BarChart3, CalendarClock, Share2, ThumbsUp } from "lucide-react";

export default async function PostsOverviewPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Posts</h1>
          <p className="text-muted-foreground">
            Engagement metrics for published scheduled posts, plus quick links
            to scheduling and full social analytics.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ThumbsUp className="h-5 w-5" />
                Post likes
              </CardTitle>
              <CardDescription>
                Rank synced metrics by like count per post.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/posts/like">Open post likes</Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Share2 className="h-5 w-5" />
                Post shares
              </CardTitle>
              <CardDescription>
                Rank synced metrics by share count per post.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/posts/share">Open post shares</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Related</CardTitle>
            <CardDescription>
              Scheduling, publishing, and the full metrics dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/content/scheduled-posts">
                <CalendarClock className="mr-2 h-4 w-4" />
                Scheduled posts
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/analytics/social">
                <BarChart3 className="mr-2 h-4 w-4" />
                Social analytics
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
