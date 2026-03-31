import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import PostMetrics from "@/models/PostMetrics";

const SORT_FIELDS = {
  likes: { likes: -1 as const },
  shares: { shares: -1 as const },
  engagement: { engagementRate: -1 as const },
  fetchedAt: { fetchedAt: -1 as const },
} as const;

type SortKey = keyof typeof SORT_FIELDS;

function resolveSort(
  topOnly: boolean,
  sortByParam: string | null,
): Record<string, 1 | -1> {
  if (topOnly) return SORT_FIELDS.engagement;
  if (sortByParam && Object.hasOwn(SORT_FIELDS, sortByParam)) {
    return SORT_FIELDS[sortByParam as SortKey] as Record<string, 1 | -1>;
  }
  return SORT_FIELDS.fetchedAt;
}

export async function GET(request: NextRequest) {
  const denied = await requireSessionApi(request);
  if (denied) return denied;
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const platform = searchParams.get("platform");
    const limit = parseInt(searchParams.get("limit") ?? "50", 10);
    const topOnly = searchParams.get("top") === "true";
    const sortBy = searchParams.get("sortBy");

    const query: Record<string, unknown> = {};
    if (clientId) query.clientId = clientId;
    if (platform) query.platform = platform;

    const metrics = await PostMetrics.find(query)
      .populate("scheduledPostId", "content platform publishDate")
      .sort(resolveSort(topOnly, sortBy))
      .limit(limit);

    const platformTotals = await PostMetrics.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$platform",
          avgEngagementRate: { $avg: "$engagementRate" },
          totalImpressions: { $sum: "$impressions" },
          totalLikes: { $sum: "$likes" },
          totalComments: { $sum: "$comments" },
          count: { $sum: 1 },
        },
      },
    ]);

    return NextResponse.json({ metrics, platformTotals });
  } catch (error) {
    console.error("Error fetching social analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch social analytics" },
      { status: 500 },
    );
  }
}
