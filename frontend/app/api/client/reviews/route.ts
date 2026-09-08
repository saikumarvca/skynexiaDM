import { NextRequest, NextResponse } from "next/server";
import { requireClientSessionApi } from "@/lib/client-portal/session";
import { parseClientDateRange } from "@/lib/client-portal/date-range";
import { listClientReviews } from "@/lib/client-portal/reviews";
import {
  CLIENT_REVIEW_STATUSES,
  clampPage,
  clampPageSize,
  type ClientReviewStatus,
} from "@/lib/client-portal/dto";

/**
 * GET /api/client/reviews
 *   ?status=POSTED|SHARED|IN_PROGRESS|DRAFT
 *   &platform=Google&search=...&range=...&from=&to=&page=1&pageSize=20
 */
export async function GET(request: NextRequest) {
  const auth = await requireClientSessionApi(request);
  if (auth.denied) return auth.denied;

  try {
    const { searchParams } = new URL(request.url);
    const statusRaw = searchParams.get("status")?.toUpperCase() ?? "";
    const status = CLIENT_REVIEW_STATUSES.includes(statusRaw as ClientReviewStatus)
      ? (statusRaw as ClientReviewStatus)
      : null;

    const rangeKey = searchParams.get("range");
    const range = rangeKey
      ? parseClientDateRange({
          range: rangeKey,
          from: searchParams.get("from"),
          to: searchParams.get("to"),
        })
      : null;

    const result = await listClientReviews(auth.ctx.clientId, {
      status,
      platform: searchParams.get("platform"),
      search: searchParams.get("search"),
      from: range?.from ?? null,
      to: range?.to ?? null,
      page: clampPage(searchParams.get("page")),
      pageSize: clampPageSize(searchParams.get("pageSize")),
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error listing client reviews:", error);
    return NextResponse.json({ error: "Failed to load reviews" }, { status: 500 });
  }
}
