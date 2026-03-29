import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import Keyword from "@/models/Keyword";
import Competitor from "@/models/Competitor";
import CompetitorKeywordRank from "@/models/CompetitorKeywordRank";

export async function GET(request: NextRequest) {
  const denied = await requireSessionApi(request);
  if (denied) return denied;
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    if (!clientId)
      return NextResponse.json({ error: "clientId required" }, { status: 400 });

    const [keywords, competitors] = await Promise.all([
      Keyword.find({ clientId, status: "ACTIVE" }).lean(),
      Competitor.find({ clientId, isActive: true }).lean(),
    ]);

    const competitorRanks = await CompetitorKeywordRank.find({
      clientId,
      competitorId: { $in: competitors.map((c) => c._id) },
    }).lean();

    const rankMap: Record<string, Record<string, number>> = {};
    for (const cr of competitorRanks) {
      const cId = String(cr.competitorId);
      if (!rankMap[cId]) rankMap[cId] = {};
      if (cr.rank) rankMap[cId][cr.keyword] = cr.rank;
    }

    const gaps = keywords.map((kw) => {
      const clientRank = kw.rank ?? null;
      const competitorData = competitors.map((c) => ({
        competitorId: String(c._id),
        name: c.name,
        domain: c.domain,
        rank: rankMap[String(c._id)]?.[kw.keyword] ?? null,
      }));
      const bestCompetitorRank = competitorData.reduce(
        (best: number | null, cd) => {
          if (cd.rank === null) return best;
          return best === null ? cd.rank : Math.min(best, cd.rank);
        },
        null,
      );
      const gap =
        clientRank !== null && bestCompetitorRank !== null
          ? bestCompetitorRank - clientRank
          : null;
      return {
        keyword: kw.keyword,
        clientRank,
        competitors: competitorData,
        bestCompetitorRank,
        gap,
        losing: gap !== null && gap < 0,
      };
    });

    gaps.sort((a, b) => {
      if (a.gap === null) return 1;
      if (b.gap === null) return -1;
      return a.gap - b.gap;
    });

    return NextResponse.json({ keywords: gaps, competitors });
  } catch (error) {
    console.error("Error computing rank gap:", error);
    return NextResponse.json(
      { error: "Failed to compute rank gap" },
      { status: 500 },
    );
  }
}
