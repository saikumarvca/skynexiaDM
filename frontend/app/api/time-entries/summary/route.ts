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
    const month = searchParams.get("month"); // YYYY-MM

    const query: Record<string, unknown> = {};
    if (clientId) query.clientId = clientId;
    if (userId) query.userId = userId;
    if (month) {
      const [ys, ms] = month.split("-");
      const year = Number(ys);
      const mo = Number(ms);
      if (Number.isFinite(year) && Number.isFinite(mo)) {
        const start = new Date(year, mo - 1, 1);
        const end = new Date(year, mo, 1);
        query.date = { $gte: start, $lt: end };
      }
    }

    const agg = await TimeEntry.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$isBillable",
          totalMinutes: { $sum: "$durationMinutes" },
          count: { $sum: 1 },
        },
      },
    ]);

    const billable = agg.find((a) => a._id === true) ?? {
      totalMinutes: 0,
      count: 0,
    };
    const nonBillable = agg.find((a) => a._id === false) ?? {
      totalMinutes: 0,
      count: 0,
    };

    const byClient = await TimeEntry.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$clientId",
          totalMinutes: { $sum: "$durationMinutes" },
          billableMinutes: {
            $sum: { $cond: ["$isBillable", "$durationMinutes", 0] },
          },
        },
      },
      {
        $lookup: {
          from: "clients",
          localField: "_id",
          foreignField: "_id",
          as: "client",
        },
      },
      { $unwind: { path: "$client", preserveNullAndEmptyArrays: true } },
      { $sort: { totalMinutes: -1 } },
    ]);

    return NextResponse.json({
      billableMinutes: billable.totalMinutes,
      nonBillableMinutes: nonBillable.totalMinutes,
      totalMinutes: billable.totalMinutes + nonBillable.totalMinutes,
      billableHours: +(billable.totalMinutes / 60).toFixed(1),
      nonBillableHours: +(nonBillable.totalMinutes / 60).toFixed(1),
      totalHours: +(
        (billable.totalMinutes + nonBillable.totalMinutes) /
        60
      ).toFixed(1),
      byClient,
    });
  } catch (error) {
    console.error("Error computing time summary:", error);
    return NextResponse.json(
      { error: "Failed to compute time summary" },
      { status: 500 },
    );
  }
}
