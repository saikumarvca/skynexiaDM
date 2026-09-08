import { NextRequest, NextResponse } from "next/server";
import { requireClientSessionApi } from "@/lib/client-portal/session";
import { parseClientDateRange } from "@/lib/client-portal/date-range";
import { getClientReviewAnalytics } from "@/lib/client-portal/analytics";

/** GET /api/client/review-analytics?range=&from=&to= */
export async function GET(request: NextRequest) {
  const auth = await requireClientSessionApi(request);
  if (auth.denied) return auth.denied;

  try {
    const { searchParams } = new URL(request.url);
    const range = parseClientDateRange({
      range: searchParams.get("range"),
      from: searchParams.get("from"),
      to: searchParams.get("to"),
    });
    const data = await getClientReviewAnalytics(auth.ctx.clientId, range);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error loading client review analytics:", error);
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}
