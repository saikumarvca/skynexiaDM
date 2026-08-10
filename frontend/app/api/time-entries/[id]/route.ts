import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import TimeEntry from "@/models/TimeEntry";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireSessionApi(request);
  if (denied) return denied;
  try {
    await dbConnect();
    const { id } = await params;
    const entry = await TimeEntry.findById(id).populate(
      "clientId",
      "name businessName",
    );
    if (!entry)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(entry);
  } catch (error) {
    console.error("Error fetching time entry:", error);
    return NextResponse.json(
      { error: "Failed to fetch time entry" },
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
    const body = await request.json();
    const entry = await TimeEntry.findByIdAndUpdate(id, body, { new: true });
    if (!entry)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(entry);
  } catch (error) {
    console.error("Error updating time entry:", error);
    return NextResponse.json(
      { error: "Failed to update time entry" },
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
    await TimeEntry.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting time entry:", error);
    return NextResponse.json(
      { error: "Failed to delete time entry" },
      { status: 500 },
    );
  }
}
