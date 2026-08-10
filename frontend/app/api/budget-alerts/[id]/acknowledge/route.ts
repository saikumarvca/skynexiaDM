import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import BudgetAlert from "@/models/BudgetAlert";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireSessionApi(request);
  if (denied) return denied;
  try {
    await dbConnect();
    const { id } = await params;
    const alert = await BudgetAlert.findByIdAndUpdate(
      id,
      { isAcknowledged: true, acknowledgedAt: new Date() },
      { new: true },
    );
    if (!alert)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(alert);
  } catch (error) {
    console.error("Error acknowledging budget alert:", error);
    return NextResponse.json(
      { error: "Failed to acknowledge alert" },
      { status: 500 },
    );
  }
}
