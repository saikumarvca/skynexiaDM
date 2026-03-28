import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireUserFromRequest, assertAdmin } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Webhook from "@/models/Webhook";

function authError(error: unknown) {
  if (error instanceof Error) {
    if (error.message === "UNAUTHENTICATED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error.message === "FORBIDDEN")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    return NextResponse.json(webhook);
  } catch (error) {
    const res = authError(error);
    if (res) return res;
    console.error("Error fetching webhook:", error);
    return NextResponse.json({ error: "Failed to fetch webhook" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUserFromRequest(request);
    assertAdmin(user);

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    await dbConnect();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    const set: Record<string, unknown> = {};

    if (typeof body.name === "string" && body.name.trim()) {
      set.name = body.name.trim();
    }
    if (typeof body.url === "string" && body.url.trim()) {
      try {
        new URL(body.url.trim());
        set.url = body.url.trim();
      } catch {
        return NextResponse.json({ error: "url must be a valid URL" }, { status: 400 });
      }
    }
    if (Array.isArray(body.events)) {
      set.events = body.events;
    }
    if (body.secret !== undefined) {
      set.secret = typeof body.secret === "string" && body.secret.trim() ? body.secret.trim() : undefined;
    }
    if (typeof body.isActive === "boolean") {
      set.isActive = body.isActive;
    }

    const updated = await Webhook.findByIdAndUpdate(id, { $set: set }, { new: true });
    if (!updated) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    const res = authError(error);
    if (res) return res;
    console.error("Error updating webhook:", error);
    return NextResponse.json({ error: "Failed to update webhook" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUserFromRequest(request);
    assertAdmin(user);

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    await dbConnect();
    const updated = await Webhook.findByIdAndUpdate(
      id,
      { $set: { isActive: false } },
      { new: true }
    );
    if (!updated) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    const res = authError(error);
    if (res) return res;
    console.error("Error disabling webhook:", error);
    return NextResponse.json({ error: "Failed to disable webhook" }, { status: 500 });
  }
}
