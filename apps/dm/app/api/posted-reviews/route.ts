import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import PostedReview from "@/models/PostedReview";

export async function GET(request: NextRequest) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const draftId = searchParams.get("draftId");
    const platform = searchParams.get("platform");
    const search = searchParams.get("search");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const query: Record<string, unknown> = {};
    if (draftId) query.draftId = draftId;
    if (platform) query.platform = platform;

    if (dateFrom || dateTo) {
      query.postedDate = {};
      if (dateFrom)
        (query.postedDate as Record<string, unknown>).$gte = new Date(dateFrom);
      if (dateTo)
        (query.postedDate as Record<string, unknown>).$lte = new Date(
          dateTo + "T23:59:59.999Z",
        );
    }

    let posted = await PostedReview.find(query)
      .populate("draftId", "subject reviewText")
      .populate("allocationId", "assignedToUserName")
      .sort({ postedDate: -1 });

    if (search) {
      const s = search.toLowerCase();
      posted = posted.filter((p) => {
        const draft = p.draftId as {
          subject?: string;
          reviewText?: string;
        } | null;
        const subject = (draft?.subject ?? "").toLowerCase();
        const reviewText = (draft?.reviewText ?? "").toLowerCase();
        const postedByName = (p.postedByName ?? "").toLowerCase();
        return (
          subject.includes(s) ||
          reviewText.includes(s) ||
          postedByName.includes(s)
        );
      });
    }

    return NextResponse.json(posted);
  } catch (error) {
    console.error("Error fetching posted reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch posted reviews" },
      { status: 500 },
    );
  }
}
