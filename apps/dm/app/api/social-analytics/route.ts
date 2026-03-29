import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import PostMetrics from "@/models/PostMetrics";
import ScheduledPost from "@/models/ScheduledPost";

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

    const query: Record<string, unknown> = {};
    if (clientId) query.clientId = clientId;
    if (platform) query.platform = platform;

    const metrics = await PostMetrics.find(query)
      .populate("scheduledPostId", "content platform publishDate")
      .sort(topOnly ? { engagementRate: -1 } : { fetchedAt: -1 })
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
