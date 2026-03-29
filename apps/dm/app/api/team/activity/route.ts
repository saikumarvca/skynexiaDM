import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import TeamActivityLog from "@/models/TeamActivityLog";
import { buildActivityQuery } from "@/lib/team/activity";

export async function GET(request: NextRequest) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const module = searchParams.get("module");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "20")),
    );
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;

    const query = buildActivityQuery({
      userId: userId ?? undefined,
      module: module ?? undefined,
      dateFrom: dateFrom ?? undefined,
      dateTo: dateTo ?? undefined,
    });

    const [items, total] = await Promise.all([
      TeamActivityLog.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      TeamActivityLog.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);
    return NextResponse.json({
      items,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching team activity:", error);
    return NextResponse.json(
      { error: "Failed to fetch team activity" },
      { status: 500 },
    );
  }
}
