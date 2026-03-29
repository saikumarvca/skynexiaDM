import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import Campaign from "@/models/Campaign";
import { triggerWebhook } from "@/lib/webhooks";

export async function GET(request: NextRequest) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const platform = searchParams.get("platform");
    const status = searchParams.get("status");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const query: Record<string, unknown> = {};
    if (clientId) query.clientId = clientId;
    if (platform) query.platform = platform;
    if (status) query.status = status;
    if (dateFrom || dateTo) {
      query.startDate = {};
      if (dateFrom)
        (query.startDate as Record<string, unknown>).$gte = new Date(dateFrom);
      if (dateTo)
        (query.startDate as Record<string, unknown>).$lte = new Date(dateTo);
    }

    const campaigns = await Campaign.find(query)
      .populate("clientId", "name businessName")
      .sort({ createdAt: -1 });
    return NextResponse.json(campaigns);
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaigns" },
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
    const campaign = new Campaign(body);
    await campaign.save();
    triggerWebhook("campaign.created", {
      campaignId: campaign._id.toString(),
      campaignName: campaign.campaignName,
      clientId: campaign.clientId?.toString(),
    }).catch(() => {});
    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error("Error creating campaign:", error);
    return NextResponse.json(
      { error: "Failed to create campaign" },
      { status: 500 },
    );
  }
}
