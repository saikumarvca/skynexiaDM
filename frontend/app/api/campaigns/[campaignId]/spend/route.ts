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
    const entries = await CampaignSpendEntry.find({ campaignId }).sort({
      date: -1,
    });
    return NextResponse.json(entries);
  } catch (error) {
    console.error("Error fetching spend entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch spend entries" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> },
) {
  const denied = await requireSessionApi(request);
  if (denied) return denied;
  try {
    await dbConnect();
    const { campaignId } = await params;
    const body = await request.json();
    const campaign = await Campaign.findById(campaignId);
    if (!campaign)
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 },
      );
    const entry = new CampaignSpendEntry({
      ...body,
      campaignId,
      clientId: campaign.clientId,
    });
    await entry.save();
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("Error creating spend entry:", error);
    return NextResponse.json(
      { error: "Failed to create spend entry" },
      { status: 500 },
    );
  }
}
