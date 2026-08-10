import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import FileAsset from "@/models/FileAsset";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> },
) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    await dbConnect();
    const { fileId } = await params;
    const updated = await FileAsset.findByIdAndUpdate(
      fileId,
      { $set: { isArchived: true } },
      { new: true },
    );
    if (!updated) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error archiving file:", error);
    return NextResponse.json(
      { error: "Failed to archive file" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> },
) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    await dbConnect();
    const { fileId } = await params;
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const set: Record<string, unknown> = {};
    if (typeof body.isArchived === "boolean") {
      set.isArchived = body.isArchived;
    }
    if (Object.keys(set).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 },
      );
    }
    const updated = await FileAsset.findByIdAndUpdate(
      fileId,
      { $set: set },
      { new: true },
    );
    if (!updated) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating file:", error);
    return NextResponse.json(
      { error: "Failed to update file" },
      { status: 500 },
    );
  }
}
