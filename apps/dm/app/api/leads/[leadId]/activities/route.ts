import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import LeadActivity from "@/models/LeadActivity";
import Lead from "@/models/Lead";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> },
) {
  const denied = await requireSessionApi(request);
  if (denied) return denied;
  try {
    await dbConnect();
    const { leadId } = await params;
    const activities = await LeadActivity.find({ leadId }).sort({
      performedAt: -1,
    });
    return NextResponse.json(activities);
  } catch (error) {
    console.error("Error fetching lead activities:", error);
    return NextResponse.json(
      { error: "Failed to fetch lead activities" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> },
) {
  const denied = await requireSessionApi(request);
  if (denied) return denied;
  try {
    await dbConnect();
    const { leadId } = await params;
    const lead = await Lead.findById(leadId);
    if (!lead)
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    const body = await request.json();
    const activity = new LeadActivity({
      ...body,
      leadId,
      clientId: lead.clientId,
      performedAt: body.performedAt ? new Date(body.performedAt) : new Date(),
    });
    await activity.save();
    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error("Error creating lead activity:", error);
    return NextResponse.json(
      { error: "Failed to create lead activity" },
      { status: 500 },
    );
  }
}
