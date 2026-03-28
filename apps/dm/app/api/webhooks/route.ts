import { NextRequest, NextResponse } from "next/server";
import { requireUserFromRequest, assertAdmin } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Webhook from "@/models/Webhook";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUserFromRequest(request);
    assertAdmin(user);

    await dbConnect();
    const webhooks = await Webhook.find().sort({ createdAt: -1 });
    return NextResponse.json(webhooks);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHENTICATED")
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      if (error.message === "FORBIDDEN")
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error fetching webhooks:", error);
    return NextResponse.json({ error: "Failed to fetch webhooks" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUserFromRequest(request);
    assertAdmin(user);

    await dbConnect();
    const body = (await request.json()) as {
      name?: string;
      url?: string;
      events?: string[];
      secret?: string;
    };

    if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    if (!body.url || typeof body.url !== "string") {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }
    try {
      new URL(body.url);
    } catch {
      return NextResponse.json({ error: "url must be a valid URL" }, { status: 400 });
    }
    if (!Array.isArray(body.events) || body.events.length === 0) {
      return NextResponse.json({ error: "events must be a non-empty array" }, { status: 400 });
    }

    const webhook = new Webhook({
      name: body.name.trim(),
      url: body.url.trim(),
      events: body.events,
      secret: body.secret?.trim() || undefined,
      isActive: true,
    });
    await webhook.save();

    return NextResponse.json(webhook, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHENTICATED")
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      if (error.message === "FORBIDDEN")
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error creating webhook:", error);
    return NextResponse.json({ error: "Failed to create webhook" }, { status: 500 });
  }
}
