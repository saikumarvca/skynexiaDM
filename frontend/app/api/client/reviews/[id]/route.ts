import { NextRequest, NextResponse } from "next/server";
import { requireClientSessionApi } from "@/lib/client-portal/session";
import { getClientReviewDetail } from "@/lib/client-portal/reviews";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** GET /api/client/reviews/[id] — 404 unless the review belongs to the client. */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = await requireClientSessionApi(request);
  if (auth.denied) return auth.denied;

  try {
    const { id } = await params;
    const review = await getClientReviewDetail(auth.ctx.clientId, id);
    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }
    return NextResponse.json(review);
  } catch (error) {
    console.error("Error loading client review:", error);
    return NextResponse.json({ error: "Failed to load review" }, { status: 500 });
  }
}
