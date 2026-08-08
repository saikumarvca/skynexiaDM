import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import ScheduledPost from "@/models/ScheduledPost";
import { publishPost } from "@/lib/social-publishing";

export async function POST(request: NextRequest) {
  const denied = await requireSessionApi(request);
  if (denied) return denied;

  try {
    await dbConnect();
    const body = await request.json();
    const { postId } = body as { postId?: string };

    if (!postId) {
      return NextResponse.json(
        { error: "postId is required" },
        { status: 400 },
      );
    }

    const post = await ScheduledPost.findById(postId);
    if (!post) {
      return NextResponse.json(
        { error: "Scheduled post not found" },
        { status: 404 },
      );
    }

    const result = await publishPost(post);

    if (result.success) {
      post.status = "PUBLISHED";
      await post.save();
      return NextResponse.json({
        success: true,
        postId: result.postId,
        platform: result.platform,
      });
    } else {
      post.status = "FAILED";
      await post.save();
      return NextResponse.json(
        { success: false, error: result.error, platform: result.platform },
        { status: 422 },
      );
    }
  } catch (error) {
    console.error("Error publishing scheduled post:", error);
    return NextResponse.json(
      { error: "Failed to publish post" },
      { status: 500 },
    );
  }
}
