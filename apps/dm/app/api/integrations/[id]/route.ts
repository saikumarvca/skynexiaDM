import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import Integration from "@/models/Integration";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireSessionApi(request);
  if (denied) return denied;
  try {
    await dbConnect();
    const { id } = await params;
    const integration = await Integration.findById(id);
    if (!integration)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(integration);
  } catch (error) {
    console.error("Error fetching integration:", error);
    return NextResponse.json(
      { error: "Failed to fetch integration" },
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
    const integration = await Integration.findByIdAndUpdate(id, body, {
      new: true,
    });
    if (!integration)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(integration);
  } catch (error) {
    console.error("Error updating integration:", error);
    return NextResponse.json(
      { error: "Failed to update integration" },
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
    await Integration.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting integration:", error);
    return NextResponse.json(
      { error: "Failed to delete integration" },
      { status: 500 },
    );
  }
}
