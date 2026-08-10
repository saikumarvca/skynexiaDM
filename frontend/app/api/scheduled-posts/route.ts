import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import ScheduledPost from "@/models/ScheduledPost";
import {
  mongoFieldsFromScheduledPostCreate,
  scheduledPostCreateSchema,
} from "@/lib/api/schemas";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const platform = searchParams.get("platform");
    const status = searchParams.get("status");

    const query: Record<string, unknown> = {};
    if (clientId) query.clientId = clientId;
    if (platform) query.platform = platform;
    if (status) query.status = status;

    const posts = await ScheduledPost.find(query)
      .populate("clientId", "businessName name")
      .sort({ publishDate: 1 })
      .lean();
    return NextResponse.json(posts);
  } catch (error) {
    console.error("Error fetching scheduled posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch scheduled posts" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    await dbConnect();
    const body = await request.json();
    const parsed = scheduledPostCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid scheduled post", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    let fields: Record<string, unknown>;
    try {
      fields = mongoFieldsFromScheduledPostCreate(parsed.data);
    } catch {
      return NextResponse.json(
        { error: "Invalid publish date" },
        { status: 400 },
      );
    }
    const post = new ScheduledPost(fields);
    await post.save();
    const populated = await ScheduledPost.findById(post._id)
      .populate("clientId", "businessName name")
      .lean();
    return NextResponse.json(populated, { status: 201 });
  } catch (error) {
    console.error("Error creating scheduled post:", error);
    return NextResponse.json(
      { error: "Failed to create scheduled post" },
      { status: 500 },
    );
  }
}
