import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import CampaignSpendEntry from "@/models/CampaignSpendEntry";
import Campaign from "@/models/Campaign";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> },
) {
  const denied = await requireSessionApi(request);
  if (denied) return denied;
  try {
    await dbConnect();
    const { campaignId } = await params;
    const campaign = await Campaign.findById(campaignId);
    if (!campaign)
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 },
      );

    const budget = campaign.budget ?? 0;
    const agg = await CampaignSpendEntry.aggregate([
      { $match: { campaignId: campaign._id } },
      { $group: { _id: null, total: { $sum: "$spend" } } },
    ]);
    const spendToDate = agg[0]?.total ?? 0;

    const startDate = campaign.startDate ? new Date(campaign.startDate) : null;
    const endDate = campaign.endDate ? new Date(campaign.endDate) : null;
    const now = new Date();

    let pacingStatus = "ON_TRACK";
    let flightProgress = null;
    let budgetProgress = null;

    if (startDate && endDate && budget > 0) {
      const totalDays = Math.max(
        1,
        (endDate.getTime() - startDate.getTime()) / 86400000,
      );
      const elapsedDays = Math.max(
        0,
        (now.getTime() - startDate.getTime()) / 86400000,
      );
      flightProgress = Math.min(1, elapsedDays / totalDays);
      budgetProgress = spendToDate / budget;

      if (budgetProgress > flightProgress + 0.1) pacingStatus = "OVER_PACING";
      else if (budgetProgress < flightProgress - 0.1)
        pacingStatus = "UNDER_PACING";
    }

    return NextResponse.json({
      campaignId,
      budget,
      spendToDate,
      remaining: Math.max(0, budget - spendToDate),
      flightProgress,
      budgetProgress,
      pacingStatus,
    });
  } catch (error) {
    console.error("Error computing pacing:", error);
    return NextResponse.json(
      { error: "Failed to compute pacing" },
      { status: 500 },
    );
  }
}
