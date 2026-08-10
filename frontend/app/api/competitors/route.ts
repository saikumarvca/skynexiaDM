import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import Competitor from "@/models/Competitor";

export async function GET(request: NextRequest) {
  const denied = await requireSessionApi(request);
  if (denied) return denied;
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const query: Record<string, unknown> = {};
    if (clientId) query.clientId = clientId;
    const competitors = await Competitor.find(query).sort({ createdAt: -1 });
    return NextResponse.json(competitors);
  } catch (error) {
    console.error("Error fetching competitors:", error);
    return NextResponse.json(
      { error: "Failed to fetch competitors" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const denied = await requireSessionApi(request);
  if (denied) return denied;
  try {
    await dbConnect();
    const body = await request.json();
    const competitor = new Competitor(body);
    await competitor.save();
    return NextResponse.json(competitor, { status: 201 });
  } catch (error) {
    console.error("Error creating competitor:", error);
    return NextResponse.json(
      { error: "Failed to create competitor" },
      { status: 500 },
    );
  }
}
