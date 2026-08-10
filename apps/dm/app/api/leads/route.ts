import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import Lead from "@/models/Lead";
import { triggerWebhook } from "@/lib/webhooks";

export async function GET(request: NextRequest) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const status = searchParams.get("status");
    const source = searchParams.get("source");
    const campaignId = searchParams.get("campaignId");

    const query: Record<string, unknown> = {};
    if (clientId) query.clientId = clientId;
    if (status) query.status = status;
    if (source) query.source = source;
    if (campaignId) query.campaignId = campaignId;

    const leads = await Lead.find(query)
      .populate("clientId", "name businessName")
      .populate("campaignId", "campaignName")
      .sort({ createdAt: -1 });
    return NextResponse.json(leads);
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json(
      { error: "Failed to fetch leads" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const lead = new Lead(body);
    await lead.save();
    triggerWebhook("lead.created", {
      leadId: lead._id.toString(),
      name: lead.name,
      clientId: lead.clientId?.toString(),
    }).catch(() => {});
    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error("Error creating lead:", error);
    return NextResponse.json(
      { error: "Failed to create lead" },
      { status: 500 },
    );
  }
}
