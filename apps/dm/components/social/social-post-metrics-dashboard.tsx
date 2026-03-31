import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, ThumbsUp, MessageSquare, Share2, Eye } from "lucide-react";
import { serverFetch } from "@/lib/server-fetch";
import { cn } from "@/lib/utils";

function firstString(
  v: string | string[] | undefined,
): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && v[0]) return v[0];
  return undefined;
}

export type SocialPostMetricsVariant = "full" | "likes" | "shares";

export interface PostMetricRow {
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

export interface PlatformTotalRow {
  _id: string;
  avgEngagementRate: number;
  totalImpressions: number;
  totalLikes: number;
  totalComments: number;
  count: number;
}

async function getSocialAnalytics(
  clientId?: string,
  platform?: string,
  opts?: { sortBy?: string; top?: boolean; limit?: number },
) {
  try {
    const url = new URL("/api/social-analytics", "http://localhost");
    if (clientId) url.searchParams.set("clientId", clientId);
    if (platform) url.searchParams.set("platform", platform);
    if (opts?.sortBy) url.searchParams.set("sortBy", opts.sortBy);
    if (opts?.top) url.searchParams.set("top", "true");
    if (opts?.limit != null && opts.limit > 0)
      url.searchParams.set("limit", String(opts.limit));
    const res = await serverFetch(url.pathname + url.search);
    if (!res.ok) return { metrics: [], platformTotals: [] };
    return await res.json();
  } catch {
    return { metrics: [], platformTotals: [] };
  }
}

const variantCopy: Record<
  SocialPostMetricsVariant,
  { title: string; description: string; tableTitle: string }
> = {
  full: {
    title: "Social Analytics",
    description: "Post performance metrics across all social platforms.",
    tableTitle: "Post Performance",
  },
  likes: {
    title: "Post likes",
    description:
      "Scheduled posts ranked and summarized by like counts from synced metrics.",
    tableTitle: "Posts by likes",
  },
  shares: {
    title: "Post shares",
    description:
      "Scheduled posts ranked and summarized by share counts from synced metrics.",
    tableTitle: "Posts by shares",
  },
};

export async function SocialPostMetricsDashboard({
  searchParams,
  variant,
  defaultSortBy,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  variant: SocialPostMetricsVariant;
  defaultSortBy?: "likes" | "shares" | "engagement" | "fetchedAt";
}) {
  const raw = await searchParams;
  const params = {
    clientId: firstString(raw.clientId),
    platform: firstString(raw.platform),
    sortBy: firstString(raw.sortBy),
    limitStr: firstString(raw.limit),
    top: firstString(raw.top) === "true",
  };
  const limitParsed = params.limitStr
    ? parseInt(params.limitStr, 10)
    : undefined;
  const apiLimit =
    limitParsed != null && !Number.isNaN(limitParsed) && limitParsed > 0
      ? limitParsed
      : undefined;

  const sortKeys = ["likes", "shares", "engagement", "fetchedAt"] as const;
  const effectiveSort =
    params.sortBy &&
    (sortKeys as readonly string[]).includes(params.sortBy)
      ? (params.sortBy as (typeof sortKeys)[number])
      : defaultSortBy;

  const data = await getSocialAnalytics(params.clientId, params.platform, {
    sortBy: effectiveSort,
    top: params.top,
    limit: apiLimit,
  });
  const metrics: PostMetricRow[] = data.metrics ?? [];
  const platformTotals: PlatformTotalRow[] = data.platformTotals ?? [];
  const copy = variantCopy[variant];

  const likesColClass =
    variant === "likes" ? "bg-primary/5 font-semibold" : "";
  const sharesColClass =
    variant === "shares" ? "bg-primary/5 font-semibold" : "";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{copy.title}</h1>
            <p className="text-muted-foreground">{copy.description}</p>
          </div>
          <form method="get" className="flex flex-wrap gap-2">
            {effectiveSort ? (
              <input type="hidden" name="sortBy" value={effectiveSort} />
            ) : null}
            {apiLimit != null ? (
              <input type="hidden" name="limit" value={String(apiLimit)} />
            ) : null}
            {params.top ? (
              <input type="hidden" name="top" value="true" />
            ) : null}
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
              {copy.tableTitle} ({metrics.length})
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
                      <th
                        className={cn(
                          "pb-2 pr-4 font-medium",
                          variant === "likes" && "text-primary",
                        )}
                      >
                        <ThumbsUp className="inline h-3.5 w-3.5 mr-1" />
                        Likes
                      </th>
                      <th className="pb-2 pr-4 font-medium">
                        <MessageSquare className="inline h-3.5 w-3.5 mr-1" />
                        Comments
                      </th>
                      <th
                        className={cn(
                          "pb-2 pr-4 font-medium",
                          variant === "shares" && "text-primary",
                        )}
                      >
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
                        <td className={cn("py-2.5 pr-4", likesColClass)}>
                          {m.likes.toLocaleString()}
                        </td>
                        <td className="py-2.5 pr-4">
                          {m.comments.toLocaleString()}
                        </td>
                        <td className={cn("py-2.5 pr-4", sharesColClass)}>
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
