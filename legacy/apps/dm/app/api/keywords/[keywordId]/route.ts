import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import Keyword from "@/models/Keyword";
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

    const keyword = await Keyword.findById(keywordId)
      .populate("clientId", "name businessName")
      .lean();

    if (!keyword) {
      return NextResponse.json({ error: "Keyword not found" }, { status: 404 });
    }

    return NextResponse.json(keyword);
  } catch (error) {
    console.error("Error fetching keyword:", error);
    return NextResponse.json(
      { error: "Failed to fetch keyword" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const denied = await requireSessionApi(request);
  if (denied) return denied;

  try {
    await dbConnect();
    const { keywordId } = await params;
    const body = await request.json();

    const existing = await Keyword.findById(keywordId);
    if (!existing) {
      return NextResponse.json({ error: "Keyword not found" }, { status: 404 });
    }

    const previousRank = existing.rank;
    const newRank: number | undefined = body.rank;

    Object.assign(existing, body);
    if (newRank != null) {
      existing.lastUpdated = new Date();
    }
    await existing.save();

    // Record history entry when rank changes or is set for the first time
    if (newRank != null && newRank !== previousRank) {
      await KeywordHistory.create({
        keywordId,
        rank: newRank,
        searchVolume: body.searchVolume ?? existing.searchVolume,
        recordedAt: new Date(),
      });
    }

    return NextResponse.json(existing);
  } catch (error) {
    console.error("Error updating keyword:", error);
    return NextResponse.json(
      { error: "Failed to update keyword" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const denied = await requireSessionApi(request);
  if (denied) return denied;

  try {
    await dbConnect();
    const { keywordId } = await params;

    const keyword = await Keyword.findByIdAndUpdate(
      keywordId,
      { $set: { status: "ARCHIVED" } },
      { new: true },
    )
      .populate("clientId", "name businessName")
      .lean();

    if (!keyword) {
      return NextResponse.json({ error: "Keyword not found" }, { status: 404 });
    }

    return NextResponse.json(keyword);
  } catch (error) {
    console.error("Error archiving keyword:", error);
    return NextResponse.json(
      { error: "Failed to archive keyword" },
      { status: 500 },
    );
  }
}
