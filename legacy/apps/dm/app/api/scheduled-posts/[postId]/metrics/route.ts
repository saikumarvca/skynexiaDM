import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import PostMetrics from "@/models/PostMetrics";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  const denied = await requireSessionApi(request);
  if (denied) return denied;
  try {
    await dbConnect();
    const { postId } = await params;
    const metrics = await PostMetrics.findOne({ scheduledPostId: postId });
    if (!metrics) return NextResponse.json(null);
    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Error fetching post metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch post metrics" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  const denied = await requireSessionApi(request);
  if (denied) return denied;
  try {
    await dbConnect();
    const { postId } = await params;
    const body = await request.json();
    const metrics = await PostMetrics.findOneAndUpdate(
      { scheduledPostId: postId },
      { ...body, scheduledPostId: postId, fetchedAt: new Date() },
      { new: true, upsert: true },
    );
    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Error saving post metrics:", error);
    return NextResponse.json(
      { error: "Failed to save post metrics" },
      { status: 500 },
    );
  }
}
