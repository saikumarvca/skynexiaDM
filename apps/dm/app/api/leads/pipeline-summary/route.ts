import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import Lead from "@/models/Lead";

const STAGES = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "CLOSED_WON",
  "CLOSED_LOST",
] as const;

export async function GET(request: NextRequest) {
  const denied = await requireSessionApi(request);
  if (denied) return denied;
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const query: Record<string, unknown> = {};
    if (clientId) query.clientId = clientId;

    const agg = await Lead.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalValue: { $sum: { $ifNull: ["$estimatedValue", 0] } },
        },
      },
    ]);

    const byStage = Object.fromEntries(
      STAGES.map((s) => [s, { count: 0, totalValue: 0 }]),
    );
    for (const row of agg) {
      if (row._id in byStage)
        byStage[row._id] = { count: row.count, totalValue: row.totalValue };
    }

    const total = Object.values(byStage).reduce((s, v) => s + v.count, 0);
    const totalValue = Object.values(byStage).reduce(
      (s, v) => s + v.totalValue,
      0,
    );
    const wonValue = byStage["CLOSED_WON"]?.totalValue ?? 0;
    const conversionRate =
      total > 0
        ? Math.round(((byStage["CLOSED_WON"]?.count ?? 0) / total) * 100)
        : 0;

    return NextResponse.json({
      byStage,
      total,
      totalValue,
      wonValue,
      conversionRate,
    });
  } catch (error) {
    console.error("Error computing pipeline summary:", error);
    return NextResponse.json(
      { error: "Failed to compute pipeline summary" },
      { status: 500 },
    );
  }
}
