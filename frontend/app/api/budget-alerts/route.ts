import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import BudgetAlert from "@/models/BudgetAlert";

export async function GET(request: NextRequest) {
  const denied = await requireSessionApi(request);
  if (denied) return denied;
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const acknowledged = searchParams.get("acknowledged");
    const query: Record<string, unknown> = {};
    if (clientId) query.clientId = clientId;
    if (acknowledged !== null) query.isAcknowledged = acknowledged === "true";
    const alerts = await BudgetAlert.find(query)
      .populate("campaignId", "campaignName platform budget")
      .populate("clientId", "name businessName")
      .sort({ triggeredAt: -1 });
    return NextResponse.json(alerts);
  } catch (error) {
    console.error("Error fetching budget alerts:", error);
    return NextResponse.json(
      { error: "Failed to fetch budget alerts" },
      { status: 500 },
    );
  }
}
