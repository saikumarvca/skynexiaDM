import { NextRequest, NextResponse } from "next/server";
import { requireClientSessionApi } from "@/lib/client-portal/session";
import { parseClientDateRange } from "@/lib/client-portal/date-range";
import { getClientDashboardData } from "@/lib/client-portal/analytics";

/**
 * GET /api/client/dashboard?range=7d|30d|90d|month|prev_month|custom&from=&to=
 * KPIs, trend, status breakdown and recent activity for the signed-in client.
 */
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
    const data = await getClientDashboardData(auth.ctx.clientId, range);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error loading client dashboard:", error);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
