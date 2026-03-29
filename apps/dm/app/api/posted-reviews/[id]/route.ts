import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import PostedReview from "@/models/PostedReview";
import ReviewActivityLog from "@/models/ReviewActivityLog";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    await dbConnect();

    const { id } = await params;
    const posted = await PostedReview.findById(id)
      .populate("draftId", "subject reviewText clientName")
      .populate("allocationId", "assignedToUserName customerName platform");
    if (!posted) {
      return NextResponse.json(
        { error: "Posted review not found" },
        { status: 404 },
      );
    }

    const allocId =
      typeof posted.allocationId === "object" &&
      posted.allocationId != null &&
      "_id" in posted.allocationId
        ? String((posted.allocationId as { _id: unknown })._id)
        : String(posted.allocationId);
    const draftId =
      typeof posted.draftId === "object" &&
      posted.draftId != null &&
      "_id" in posted.draftId
        ? String((posted.draftId as { _id: unknown })._id)
        : String(posted.draftId);

    const activity = await ReviewActivityLog.find({
      $or: [
        { entityType: "POSTED_REVIEW", entityId: id },
        { entityType: "ALLOCATION", entityId: allocId },
        { entityType: "DRAFT", entityId: draftId },
      ],
    }).sort({ performedAt: -1 });

    return NextResponse.json({ posted, activity });
  } catch (error) {
    console.error("Error fetching posted review:", error);
    return NextResponse.json(
      { error: "Failed to fetch posted review" },
      { status: 500 },
    );
  }
}
