import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import mongoose from "mongoose";
import { requireUserFromRequest, assertAdmin } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Webhook from "@/models/Webhook";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUserFromRequest(request);
    assertAdmin(user);

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    await dbConnect();
    const webhook = await Webhook.findById(id);
    if (!webhook) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    const event = "webhook.test";
    const payload = { message: "Test webhook from DM Dashboard" };
    const body = JSON.stringify({
      event,
      payload,
      timestamp: new Date().toISOString(),
    });

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-DM-Event": event,
    };

    if (webhook.secret) {
      const sig = crypto
        .createHmac("sha256", webhook.secret)
        .update(body)
        .digest("hex");
      headers["X-DM-Signature"] = sig;
    }

    try {
      const res = await fetch(webhook.url, { method: "POST", headers, body });
      await Webhook.findByIdAndUpdate(webhook._id, {
        lastTriggeredAt: new Date(),
      });
      return NextResponse.json({ success: res.ok, statusCode: res.status });
    } catch (fetchErr) {
      console.error("[webhook test] fetch error:", fetchErr);
      return NextResponse.json({ success: false });
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHENTICATED")
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      if (error.message === "FORBIDDEN")
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error testing webhook:", error);
    return NextResponse.json(
      { error: "Failed to test webhook" },
      { status: 500 },
    );
  }
}
