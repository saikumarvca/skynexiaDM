import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
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
    const competitor = await Competitor.findById(id);
    if (!competitor)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(competitor);
  } catch (error) {
    console.error("Error fetching competitor:", error);
    return NextResponse.json(
      { error: "Failed to fetch competitor" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireSessionApi(request);
  if (denied) return denied;
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    const competitor = await Competitor.findByIdAndUpdate(id, body, {
      new: true,
    });
    if (!competitor)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(competitor);
  } catch (error) {
    console.error("Error updating competitor:", error);
    return NextResponse.json(
      { error: "Failed to update competitor" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireSessionApi(request);
  if (denied) return denied;
  try {
    await dbConnect();
    const { id } = await params;
    await Competitor.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting competitor:", error);
    return NextResponse.json(
      { error: "Failed to delete competitor" },
      { status: 500 },
    );
  }
}
