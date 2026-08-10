import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import Lead from "@/models/Lead";

const VALID_STATUSES = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "CLOSED_WON",
  "CLOSED_LOST",
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> },
) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    const { leadId } = await params;
    if (!mongoose.Types.ObjectId.isValid(leadId)) {
      return NextResponse.json({ error: "Invalid lead id" }, { status: 400 });
    }

    await dbConnect();
    const lead = await Lead.findById(leadId)
      .populate("clientId", "name businessName")
      .populate("campaignId", "campaignName")
      .lean();

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json(JSON.parse(JSON.stringify(lead)));
  } catch (error) {
    console.error("Error fetching lead:", error);
    return NextResponse.json(
      { error: "Failed to fetch lead" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> },
) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    const { leadId } = await params;
    if (!mongoose.Types.ObjectId.isValid(leadId)) {
      return NextResponse.json({ error: "Invalid lead id" }, { status: 400 });
    }

    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    await dbConnect();

    const existing = await Lead.findById(leadId);
    if (!existing) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const set: Record<string, unknown> = {};

    if (typeof body.name === "string" && body.name.trim()) {
      set.name = body.name.trim();
    }
    if (body.email !== undefined) {
      set.email =
        typeof body.email === "string" && body.email.trim()
          ? body.email.trim()
          : undefined;
    }
    if (body.phone !== undefined) {
      set.phone =
        typeof body.phone === "string" && body.phone.trim()
          ? body.phone.trim()
          : undefined;
    }
    if (body.source !== undefined) {
      set.source =
        typeof body.source === "string" && body.source.trim()
          ? body.source.trim()
          : undefined;
    }
    if (body.notes !== undefined) {
      set.notes =
        typeof body.notes === "string" && body.notes.trim()
          ? body.notes.trim()
          : undefined;
    }
    if (body.status !== undefined) {
      if (
        typeof body.status !== "string" ||
        !VALID_STATUSES.includes(body.status)
      ) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      set.status = body.status;
    }
    if (
      typeof body.clientId === "string" &&
      mongoose.Types.ObjectId.isValid(body.clientId)
    ) {
      set.clientId = new mongoose.Types.ObjectId(body.clientId);
    }
    if (body.campaignId !== undefined) {
      if (body.campaignId === null || body.campaignId === "") {
        set.campaignId = undefined;
      } else if (
        typeof body.campaignId === "string" &&
        mongoose.Types.ObjectId.isValid(body.campaignId)
      ) {
        set.campaignId = new mongoose.Types.ObjectId(body.campaignId);
      }
    }

    if (Object.keys(set).length === 0) {
      const unchanged = await Lead.findById(leadId)
        .populate("clientId", "name businessName")
        .populate("campaignId", "campaignName")
        .lean();
      return NextResponse.json(JSON.parse(JSON.stringify(unchanged)));
    }

    const updated = await Lead.findByIdAndUpdate(
      leadId,
      { $set: set },
      { new: true },
    )
      .populate("clientId", "name businessName")
      .populate("campaignId", "campaignName")
      .lean();

    return NextResponse.json(JSON.parse(JSON.stringify(updated)));
  } catch (error) {
    console.error("Error updating lead:", error);
    return NextResponse.json(
      { error: "Failed to update lead" },
      { status: 500 },
    );
  }
}
