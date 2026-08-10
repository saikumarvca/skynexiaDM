import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import Review from "@/models/Review";
import { requireAnyPermissionApi } from "@/lib/team/require-permission-api";

export async function GET(request: NextRequest) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    const authz = await requireAnyPermissionApi(request, [
      "manage_reviews",
      "view_reviews",
    ]);
    if (authz.denied) return authz.denied;

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const language = searchParams.get("language");

    const query: Record<string, unknown> = {};
    if (clientId) query.clientId = clientId;
    if (status && status !== "ALL") query.status = status;
    if (category) query.category = category;
    if (language) query.language = language;
    if (search) {
      query.$or = [
        { shortLabel: { $regex: search, $options: "i" } },
        { reviewText: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    const reviews = await Review.find(query)
      .populate("clientId", "name businessName")
      .sort({ createdAt: -1 });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    const authz = await requireAnyPermissionApi(request, ["manage_reviews"]);
    if (authz.denied) return authz.denied;

    await dbConnect();

    const body = await request.json();
    const review = new Review(body);
    await review.save();

    const populatedReview = await Review.findOne({ _id: review._id }).populate(
      "clientId",
      "name businessName",
    );

    return NextResponse.json(populatedReview, { status: 201 });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 },
    );
  }
}
