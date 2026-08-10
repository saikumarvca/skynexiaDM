import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import ReportSchedule from "@/models/ReportSchedule";

function computeNextSendAt(
  frequency: string,
  dayOfMonth?: number,
  dayOfWeek?: number,
): Date {
  const now = new Date();
  const next = new Date(now);
  if (frequency === "WEEKLY") {
    const target = (dayOfWeek ?? 1) % 7;
    const cur = next.getDay();
    const diff = (target - cur + 7) % 7 || 7;
    next.setDate(next.getDate() + diff);
  } else if (frequency === "MONTHLY") {
    next.setMonth(next.getMonth() + 1, dayOfMonth ?? 1);
  } else if (frequency === "QUARTERLY") {
    next.setMonth(next.getMonth() + 3, dayOfMonth ?? 1);
  }
  next.setHours(8, 0, 0, 0);
  return next;
}

export async function GET(request: NextRequest) {
  const denied = await requireSessionApi(request);
  if (denied) return denied;
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const query: Record<string, unknown> = {};
    if (clientId) query.clientId = clientId;
    const schedules = await ReportSchedule.find(query)
      .populate("clientId", "name businessName")
      .sort({ createdAt: -1 });
    return NextResponse.json(schedules);
  } catch (error) {
    console.error("Error fetching report schedules:", error);
    return NextResponse.json(
      { error: "Failed to fetch report schedules" },
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
    const nextSendAt = computeNextSendAt(
      body.frequency,
      body.dayOfMonth,
      body.dayOfWeek,
    );
    const schedule = new ReportSchedule({ ...body, nextSendAt });
    await schedule.save();
    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    console.error("Error creating report schedule:", error);
    return NextResponse.json(
      { error: "Failed to create report schedule" },
      { status: 500 },
    );
  }
}
