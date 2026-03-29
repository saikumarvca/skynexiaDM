import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, ThumbsUp, MessageSquare, Share2, Eye } from "lucide-react";
import { serverFetch } from "@/lib/server-fetch";

async function getSocialAnalytics(clientId?: string, platform?: string) {
  try {
    const url = new URL("/api/social-analytics", "http://localhost");
    if (clientId) url.searchParams.set("clientId", clientId);
    if (platform) url.searchParams.set("platform", platform);
    const res = await serverFetch(url.pathname + url.search);
    if (!res.ok) return { metrics: [], platformTotals: [] };
    return await res.json();
  } catch {
    return { metrics: [], platformTotals: [] };
  }
}

interface PostMetric {
  _id: string;
  platform: string;
  reach: number;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;
  fetchedAt: string;
  scheduledPostId?: { _id: string; content: string; publishDate: string };
}

interface PlatformTotal {
  _id: string;
  avgEngagementRate: number;
  totalImpressions: number;
  totalLikes: number;
  totalComments: number;
  count: number;
}

interface PageProps {
  searchParams: Promise<{ clientId?: string; platform?: string }>;
}

export default async function SocialAnalyticsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const data = await getSocialAnalytics(params.clientId, params.platform);
  const metrics: PostMetric[] = data.metrics ?? [];
  const platformTotals: PlatformTotal[] = data.platformTotals ?? [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Social Analytics
            </h1>
            <p className="text-muted-foreground">
              Post performance metrics across all social platforms.
            </p>
          </div>
          <form method="get" className="flex gap-2">
            <input
              name="clientId"
              defaultValue={params.clientId ?? ""}
              placeholder="Client ID"
              className="h-9 rounded-md border border-input bg-background px-3 text-sm w-48"
            />
            <select
              name="platform"
              defaultValue={params.platform ?? ""}
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            >
              <option value="">All platforms</option>
              {["facebook", "instagram", "linkedin", "twitter"].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="h-9 rounded-md bg-primary px-4 text-sm text-primary-foreground"
            >
              Filter
            </button>
          </form>
        </div>

        {platformTotals.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {platformTotals.map((pt) => (
              <Card key={pt._id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm capitalize">{pt._id}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">Posts:</span>{" "}
                    <strong>{pt.count}</strong>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Impressions:</span>{" "}
                    <strong>{pt.totalImpressions.toLocaleString()}</strong>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Likes:</span>{" "}
                    <strong>{pt.totalLikes.toLocaleString()}</strong>
                  </p>
                  <p>
                    <span className="text-muted-foreground">
                      Avg engagement:
                    </span>{" "}
                    <strong>{pt.avgEngagementRate.toFixed(2)}%</strong>
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5" />
              Post Performance ({metrics.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <BarChart3 className="mx-auto mb-3 h-10 w-10 opacity-30" />
                <p>
                  No post metrics yet. Metrics are synced automatically 24h
                  after publishing.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-4 font-medium">Platform</th>
                      <th className="pb-2 pr-4 font-medium">Date</th>
                      <th className="pb-2 pr-4 font-medium">
                        <Eye className="inline h-3.5 w-3.5 mr-1" />
                        Reach
                      </th>
                      <th className="pb-2 pr-4 font-medium">
                        <ThumbsUp className="inline h-3.5 w-3.5 mr-1" />
                        Likes
                      </th>
                      <th className="pb-2 pr-4 font-medium">
                        <MessageSquare className="inline h-3.5 w-3.5 mr-1" />
                        Comments
                      </th>
                      <th className="pb-2 pr-4 font-medium">
                        <Share2 className="inline h-3.5 w-3.5 mr-1" />
                        Shares
                      </th>
                      <th className="pb-2 font-medium">Engagement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.map((m) => (
                      <tr
                        key={m._id}
                        className="border-b last:border-0 hover:bg-muted/40"
                      >
                        <td className="py-2.5 pr-4 capitalize font-medium">
                          {m.platform}
                        </td>
                        <td className="py-2.5 pr-4 text-muted-foreground">
                          {new Date(m.fetchedAt).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 pr-4">
                          {m.reach.toLocaleString()}
                        </td>
                        <td className="py-2.5 pr-4">
                          {m.likes.toLocaleString()}
                        </td>
                        <td className="py-2.5 pr-4">
                          {m.comments.toLocaleString()}
                        </td>
                        <td className="py-2.5 pr-4">
                          {m.shares.toLocaleString()}
                        </td>
                        <td className="py-2.5">
                          {m.engagementRate.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
