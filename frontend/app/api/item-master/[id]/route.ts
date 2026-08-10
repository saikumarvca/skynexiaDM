import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import ItemMaster from "@/models/ItemMaster";
import mongoose from "mongoose";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireSessionApi(request);
  if (denied) return denied;
  try {
    await dbConnect();
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const item = await ItemMaster.findById(id).lean();
    if (!item)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(JSON.parse(JSON.stringify(item)));
  } catch (error) {
    console.error("Error fetching item master:", error);
    return NextResponse.json(
      { error: "Failed to fetch item" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireSessionApi(request);
  if (denied) return denied;
  try {
    await dbConnect();
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const body = await request.json();
    const update: Record<string, unknown> = {};
    if (typeof body.name === "string") {
      const t = body.name.trim();
      if (!t) {
        return NextResponse.json(
          { error: "Name cannot be empty" },
          { status: 400 },
        );
      }
      update.name = t;
    }
    if (typeof body.description === "string") {
      const t = body.description.trim();
      if (!t) {
        return NextResponse.json(
          { error: "Description cannot be empty" },
          { status: 400 },
        );
      }
      update.description = t;
    }
    if (body.defaultUnitPrice !== undefined) {
      const p = Number(body.defaultUnitPrice);
      if (Number.isNaN(p) || p < 0) {
        return NextResponse.json(
          { error: "Invalid default unit price" },
          { status: 400 },
        );
      }
      update.defaultUnitPrice = p;
    }
    if (typeof body.isActive === "boolean") update.isActive = body.isActive;
    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }
    const item = await ItemMaster.findByIdAndUpdate(id, update, {
      new: true,
    }).lean();
    if (!item)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(JSON.parse(JSON.stringify(item)));
  } catch (error) {
    console.error("Error updating item master:", error);
    return NextResponse.json(
      { error: "Failed to update item" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireSessionApi(request);
  if (denied) return denied;
  try {
    await dbConnect();
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const res = await ItemMaster.findByIdAndDelete(id);
    if (!res)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting item master:", error);
    return NextResponse.json(
      { error: "Failed to delete item" },
      { status: 500 },
    );
  }
}
