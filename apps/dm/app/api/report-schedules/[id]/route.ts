import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import ReportSchedule from "@/models/ReportSchedule";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireSessionApi(request);
  if (denied) return denied;
  try {
    await dbConnect();
    const { id } = await params;
    const schedule = await ReportSchedule.findById(id).populate(
      "clientId",
      "name businessName",
    );
    if (!schedule)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(schedule);
  } catch (error) {
    console.error("Error fetching report schedule:", error);
    return NextResponse.json(
      { error: "Failed to fetch report schedule" },
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
    const schedule = await ReportSchedule.findByIdAndUpdate(id, body, {
      new: true,
    });
    if (!schedule)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(schedule);
  } catch (error) {
    console.error("Error updating report schedule:", error);
    return NextResponse.json(
      { error: "Failed to update report schedule" },
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
    await ReportSchedule.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting report schedule:", error);
    return NextResponse.json(
      { error: "Failed to delete report schedule" },
      { status: 500 },
    );
  }
}
