import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import ChannelMetrics from "@/models/ChannelMetrics";

const SORT_FIELDS = {
  fetchedAt: { fetchedAt: -1 as const },
  subscribers: { subscriberCount: -1 as const },
} as const;

type SortKey = keyof typeof SORT_FIELDS;

export async function GET(request: NextRequest) {
  const denied = await requireSessionApi(request);
  if (denied) return denied;
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const platform = searchParams.get("platform");
    const search = searchParams.get("search")?.trim();
    const limit = Math.min(
      parseInt(searchParams.get("limit") ?? "100", 10) || 100,
      500,
    );
    const sortBy = searchParams.get("sortBy");

    const query: Record<string, unknown> = {};
    if (clientId) query.clientId = clientId;
    if (platform) query.platform = platform;
    if (search) {
      query.$or = [
        { channelName: { $regex: search, $options: "i" } },
        { channelId: { $regex: search, $options: "i" } },
      ];
    }

    const sort =
      sortBy && Object.hasOwn(SORT_FIELDS, sortBy)
        ? (SORT_FIELDS[sortBy as SortKey] as Record<string, 1 | -1>)
        : SORT_FIELDS.fetchedAt;

    const rows = await ChannelMetrics.find(query)
      .populate("clientId", "name businessName")
      .sort(sort)
      .limit(limit)
      .lean();

    return NextResponse.json({ channels: rows });
  } catch (error) {
    console.error("Error fetching channel metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch channel metrics" },
      { status: 500 },
    );
  }
}
