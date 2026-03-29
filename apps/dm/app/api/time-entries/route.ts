import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import TimeEntry from "@/models/TimeEntry";
export async function GET(request: NextRequest) {
  const denied = await requireSessionApi(request);
  if (denied) return denied;
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const userId = searchParams.get("userId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const query: Record<string, unknown> = {};
    if (clientId) query.clientId = clientId;
    if (userId) query.userId = userId;
    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom)
        (query.date as Record<string, unknown>).$gte = new Date(dateFrom);
      if (dateTo)
        (query.date as Record<string, unknown>).$lte = new Date(dateTo);
    }

    const entries = await TimeEntry.find(query)
      .populate("clientId", "name businessName")
      .populate("taskId", "title")
      .sort({ date: -1 });
    return NextResponse.json(entries);
  } catch (error) {
    console.error("Error fetching time entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch time entries" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const denied = await requireSessionApi(request);
  if (denied) return denied;
  try {
    await dbConnect();
    const body = await request.json();
    const entry = new TimeEntry({
      ...body,
      userId: body.userId ?? "unknown",
    });
    await entry.save();
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("Error creating time entry:", error);
    return NextResponse.json(
      { error: "Failed to create time entry" },
      { status: 500 },
    );
  }
}
