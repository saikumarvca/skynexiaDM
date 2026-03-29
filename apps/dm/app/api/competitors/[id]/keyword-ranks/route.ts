import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import CompetitorKeywordRank from "@/models/CompetitorKeywordRank";
import Competitor from "@/models/Competitor";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireSessionApi(request);
  if (denied) return denied;
  try {
    await dbConnect();
    const { id } = await params;
    const ranks = await CompetitorKeywordRank.find({ competitorId: id }).sort({
      keyword: 1,
    });
    return NextResponse.json(ranks);
  } catch (error) {
    console.error("Error fetching competitor ranks:", error);
    return NextResponse.json(
      { error: "Failed to fetch competitor ranks" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireSessionApi(request);
  if (denied) return denied;
  try {
    await dbConnect();
    const { id } = await params;
    const competitor = await Competitor.findById(id);
    if (!competitor)
      return NextResponse.json(
        { error: "Competitor not found" },
        { status: 404 },
      );
    const body = await request.json();
    const existing = await CompetitorKeywordRank.findOne({
      competitorId: id,
      keyword: body.keyword,
    });
    if (existing) {
      existing.rank = body.rank;
      existing.checkedAt = new Date();
      existing.history.push({ date: new Date(), rank: body.rank });
      await existing.save();
      return NextResponse.json(existing);
    }
    const rank = new CompetitorKeywordRank({
      competitorId: id,
      clientId: competitor.clientId,
      keyword: body.keyword,
      rank: body.rank,
      checkedAt: new Date(),
      history: [{ date: new Date(), rank: body.rank }],
    });
    await rank.save();
    return NextResponse.json(rank, { status: 201 });
  } catch (error) {
    console.error("Error saving competitor rank:", error);
    return NextResponse.json(
      { error: "Failed to save competitor rank" },
      { status: 500 },
    );
  }
}
