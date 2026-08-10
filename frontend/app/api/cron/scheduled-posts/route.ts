import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import ScheduledPost from "@/models/ScheduledPost";
import { publishPost } from "@/lib/social-publishing";

/**
 * Called by Vercel Cron or any scheduler with Authorization: Bearer CRON_SECRET.
 * Not protected by session middleware (see middleware.ts public prefix /api/cron/).
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const now = new Date();
    const due = await ScheduledPost.find({
      status: "SCHEDULED",
      publishDate: { $lte: now },
    })
      .sort({ publishDate: 1 })
      .limit(50);

    const results: { id: string; ok: boolean; error?: string }[] = [];

    for (const post of due) {
      const result = await publishPost(post);
      if (result.success) {
        post.status = "PUBLISHED";
        await post.save();
        results.push({ id: String(post._id), ok: true });
      } else {
        post.status = "FAILED";
        await post.save();
        results.push({ id: String(post._id), ok: false, error: result.error });
      }
    }

    return NextResponse.json({ processed: results.length, results });
  } catch (error) {
    console.error("Cron scheduled-posts error:", error);
    return NextResponse.json({ error: "Cron run failed" }, { status: 500 });
  }
}
