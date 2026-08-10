import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import ScheduledPost from "@/models/ScheduledPost";
import PostMetrics from "@/models/PostMetrics";

/**
 * Syncs post metrics for posts published more than 24h ago.
 * Currently stores a placeholder — wire up to Facebook Graph API / LinkedIn API
 * by providing platform-specific tokens per client.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const published = await ScheduledPost.find({
      status: "PUBLISHED",
      publishDate: { $lte: cutoff },
    }).limit(50);

    const synced: string[] = [];

    for (const post of published) {
      const existing = await PostMetrics.findOne({ scheduledPostId: post._id });
      if (existing) continue;

      // Placeholder: in production wire up to platform APIs here
      await PostMetrics.create({
        scheduledPostId: post._id,
        clientId: post.clientId,
        platform: post.platform,
        fetchedAt: new Date(),
        reach: 0,
        impressions: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        saves: 0,
        clicks: 0,
        engagementRate: 0,
      });
      synced.push(String(post._id));
    }

    return NextResponse.json({ synced: synced.length, ids: synced });
  } catch (error) {
    console.error("Cron sync-post-metrics error:", error);
    return NextResponse.json({ error: "Cron run failed" }, { status: 500 });
  }
}
