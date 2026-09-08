import { NextRequest, NextResponse } from "next/server";
import { requireClientSessionApi } from "@/lib/client-portal/session";
import { parseClientDateRange } from "@/lib/client-portal/date-range";
import { getClientChangeLog } from "@/lib/client-portal/change-log";
import { clampPage, clampPageSize } from "@/lib/client-portal/dto";

/**
 * GET /api/client/change-log
 *   ?category=FEATURE|DATA|REVIEW|SYSTEM&role=EMPLOYEE|DEVELOPER|AGENT|ADMIN|SYSTEM
 *   &range=7d|30d|90d|custom&from=&to=&search=&page=&pageSize=
 * Only CLIENT_VISIBLE events are ever returned.
 */
export async function GET(request: NextRequest) {
  const auth = await requireClientSessionApi(request);
  if (auth.denied) return auth.denied;

  try {
    const { searchParams } = new URL(request.url);
    const rangeKey = searchParams.get("range");
    const range =
      rangeKey && rangeKey !== "all"
        ? parseClientDateRange({
            range: rangeKey,
            from: searchParams.get("from"),
            to: searchParams.get("to"),
          })
        : null;

    const result = await getClientChangeLog(auth.ctx.clientId, {
      category: searchParams.get("category")?.toUpperCase() ?? null,
      role: searchParams.get("role")?.toUpperCase() ?? null,
      from: range?.from ?? null,
      to: range?.to ?? null,
      search: searchParams.get("search"),
      page: clampPage(searchParams.get("page")),
      pageSize: clampPageSize(searchParams.get("pageSize")),
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error loading client change log:", error);
    return NextResponse.json({ error: "Failed to load change log" }, { status: 500 });
  }
}
