import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import Review from "@/models/Review";
import ReviewUsage from "@/models/ReviewUsage";
import Lead from "@/models/Lead";
import Campaign from "@/models/Campaign";
import Task from "@/models/Task";

interface RouteParams {
  params: Promise<{ clientId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    await dbConnect();

    const { clientId } = await params;
    const [
      totalReviews,
      unusedReviews,
      usedReviews,
      totalUsage,
      totalLeads,
      openLeads,
      totalCampaigns,
      activeCampaigns,
      openTasks,
    ] = await Promise.all([
      Review.countDocuments({ clientId, status: { $ne: "ARCHIVED" } }),
      Review.countDocuments({ clientId, status: "UNUSED" }),
      Review.countDocuments({ clientId, status: "USED" }),
      ReviewUsage.countDocuments({ clientId }),
      Lead.countDocuments({ clientId }),
      Lead.countDocuments({
        clientId,
        status: { $in: ["NEW", "CONTACTED", "QUALIFIED"] },
      }),
      Campaign.countDocuments({ clientId }),
      Campaign.countDocuments({ clientId, status: "ACTIVE" }),
      Task.countDocuments({
        clientId,
        status: { $in: ["TODO", "IN_PROGRESS", "BLOCKED"] },
      }),
    ]);

    return NextResponse.json({
      totalReviews,
      unusedReviews,
      usedReviews,
      totalUsage,
      totalLeads,
      openLeads,
      totalCampaigns,
      activeCampaigns,
      openTasks,
    });
  } catch (error) {
    console.error("Error fetching client stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch client stats" },
      { status: 500 },
    );
  }
}
