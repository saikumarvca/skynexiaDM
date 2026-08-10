import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import KeywordHistory from "@/models/KeywordHistory";

interface RouteParams {
  params: Promise<{ keywordId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const denied = await requireSessionApi(request);
  if (denied) return denied;

  try {
    await dbConnect();
    const { keywordId } = await params;

    const history = await KeywordHistory.find({ keywordId })
      .sort({ recordedAt: -1 })
      .limit(30)
      .lean();

    return NextResponse.json(history);
  } catch (error) {
    console.error("Error fetching keyword history:", error);
    return NextResponse.json(
      { error: "Failed to fetch keyword history" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const denied = await requireSessionApi(request);
  if (denied) return denied;

  try {
    await dbConnect();
    const { keywordId } = await params;
    const body = await request.json();

    const entry = new KeywordHistory({
      keywordId,
      rank: body.rank,
      searchVolume: body.searchVolume,
      recordedAt: new Date(),
    });
    await entry.save();

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("Error recording keyword history:", error);
    return NextResponse.json(
      { error: "Failed to record keyword history" },
      { status: 500 },
    );
  }
}
