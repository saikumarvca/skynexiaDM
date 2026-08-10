import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import ClientView from "@/models/ClientView";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    await dbConnect();
    const { id } = await params;
    const updated = await ClientView.findByIdAndUpdate(
      id,
      { $set: { isArchived: true } },
      { new: true },
    );
    if (!updated) {
      return NextResponse.json(
        { error: "Client view not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error archiving client view:", error);
    return NextResponse.json(
      { error: "Failed to archive client view" },
      { status: 500 },
    );
  }
}
