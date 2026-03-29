import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import Review from "@/models/Review";

interface RouteParams {
  params: Promise<{ reviewId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    await dbConnect();

    const { reviewId } = await params;
    const review = await Review.findOne({ _id: reviewId }).populate(
      "clientId",
      "name businessName",
    );
    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    return NextResponse.json(review);
  } catch (error) {
    console.error("Error fetching review:", error);
    return NextResponse.json(
      { error: "Failed to fetch review" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    await dbConnect();

    const { reviewId } = await params;
    const body = await request.json();
    const review = await Review.findOneAndUpdate(
      { _id: reviewId },
      { ...body, updatedAt: new Date() },
      { new: true, runValidators: true },
    ).populate("clientId", "name businessName");

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    return NextResponse.json(review);
  } catch (error) {
    console.error("Error updating review:", error);
    return NextResponse.json(
      { error: "Failed to update review" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    await dbConnect();

    const { reviewId } = await params;
    const review = await Review.findOneAndUpdate(
      { _id: reviewId },
      { status: "ARCHIVED", updatedAt: new Date() },
      { new: true },
    );

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Review archived successfully" });
  } catch (error) {
    console.error("Error archiving review:", error);
    return NextResponse.json(
      { error: "Failed to archive review" },
      { status: 500 },
    );
  }
}
