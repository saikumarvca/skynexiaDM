import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import ReviewRequest from "@/models/ReviewRequest";
import Client from "@/models/Client";
import { sendEmail } from "@/lib/email";
import { reviewRequestEmail } from "@/lib/email-templates";

export async function GET(request: NextRequest) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const status = searchParams.get("status");

    const includeArchived = searchParams.get("includeArchived") === "true";

    const query: Record<string, unknown> = {};
    if (clientId && mongoose.Types.ObjectId.isValid(clientId)) {
      query.clientId = new mongoose.Types.ObjectId(clientId);
    }
    if (status) {
      query.status = status;
    } else if (!includeArchived) {
      query.status = { $ne: "ARCHIVED" };
    }

    const requests = await ReviewRequest.find(query)
      .populate("clientId", "name businessName")
      .sort({ createdAt: -1 });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Error fetching review requests:", error);
    return NextResponse.json({ error: "Failed to fetch review requests" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    await dbConnect();

    const body = (await request.json()) as {
      clientId?: string;
      recipientName?: string;
      recipientEmail?: string;
      message?: string;
    };

    if (!body.clientId || !mongoose.Types.ObjectId.isValid(body.clientId)) {
      return NextResponse.json({ error: "Valid clientId is required" }, { status: 400 });
    }
    if (!body.recipientName || typeof body.recipientName !== "string" || !body.recipientName.trim()) {
      return NextResponse.json({ error: "recipientName is required" }, { status: 400 });
    }
    if (!body.recipientEmail || typeof body.recipientEmail !== "string" || !body.recipientEmail.trim()) {
      return NextResponse.json({ error: "recipientEmail is required" }, { status: 400 });
    }

    const client = await Client.findById(body.clientId).select("name businessName").lean() as { name: string; businessName: string } | null;
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const reviewRequest = new ReviewRequest({
      clientId: new mongoose.Types.ObjectId(body.clientId),
      recipientName: body.recipientName.trim(),
      recipientEmail: body.recipientEmail.trim(),
      message: body.message?.trim() || undefined,
      status: "PENDING",
      reviewSubmitted: false,
    });

    await reviewRequest.save();

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3152";
    const reviewUrl = `${baseUrl}/reviews/${reviewRequest._id.toString()}`;

    const template = reviewRequestEmail({
      clientName: client.businessName || client.name,
      reviewerName: body.recipientName.trim(),
      reviewUrl,
    });

    const emailResult = await sendEmail({
      to: body.recipientEmail.trim(),
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (emailResult.success) {
      reviewRequest.status = "SENT";
      reviewRequest.sentAt = new Date();
    } else {
      reviewRequest.status = "FAILED";
      console.error("[review-requests] email send failed:", emailResult.error);
    }

    await reviewRequest.save();

    const populated = await ReviewRequest.findById(reviewRequest._id)
      .populate("clientId", "name businessName")
      .lean();

    return NextResponse.json(populated, { status: 201 });
  } catch (error) {
    console.error("Error creating review request:", error);
    return NextResponse.json({ error: "Failed to create review request" }, { status: 500 });
  }
}
