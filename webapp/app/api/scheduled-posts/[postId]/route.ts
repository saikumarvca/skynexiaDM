import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import ScheduledPost from "@/models/ScheduledPost";
import {
  mongoFieldsFromScheduledPostPatch,
  scheduledPostPatchSchema,
} from "@/lib/api/schemas";

interface RouteParams {
  params: Promise<{ postId: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const { postId } = await params;
    const post = await ScheduledPost.findById(postId)
      .populate("clientId", "businessName name")
      .lean();
    if (!post) {
      return NextResponse.json(
        { error: "Scheduled post not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(post);
  } catch (error) {
    console.error("Error fetching scheduled post:", error);
    return NextResponse.json(
      { error: "Failed to fetch scheduled post" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    await dbConnect();
    const { postId } = await params;
    const body = await request.json();
    const parsed = scheduledPostPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid scheduled post", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    let fields: Record<string, unknown>;
    try {
      fields = mongoFieldsFromScheduledPostPatch(parsed.data);
    } catch {
      return NextResponse.json(
        { error: "Invalid publish date" },
        { status: 400 },
      );
    }
    if (Object.keys(fields).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 },
      );
    }
    const post = await ScheduledPost.findByIdAndUpdate(
      postId,
      { ...fields, updatedAt: new Date() },
      { new: true, runValidators: true },
    )
      .populate("clientId", "businessName name")
      .lean();
    if (!post) {
      return NextResponse.json(
        { error: "Scheduled post not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(post);
  } catch (error) {
    console.error("Error updating scheduled post:", error);
    return NextResponse.json(
      { error: "Failed to update scheduled post" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    await dbConnect();
    const { postId } = await params;
    const post = await ScheduledPost.findByIdAndUpdate(
      postId,
      { $set: { status: "CANCELLED" } },
      { new: true },
    )
      .populate("clientId", "businessName name")
      .lean();
    if (!post) {
      return NextResponse.json(
        { error: "Scheduled post not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(post);
  } catch (error) {
    console.error("Error cancelling scheduled post:", error);
    return NextResponse.json(
      { error: "Failed to cancel scheduled post" },
      { status: 500 },
    );
  }
}
