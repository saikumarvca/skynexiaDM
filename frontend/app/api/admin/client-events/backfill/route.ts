import { NextRequest, NextResponse } from "next/server";
import { assertAdmin, requireUserFromRequest } from "@/lib/auth";
import { toErrorResponse } from "@/lib/api-errors";
import { backfillClientEvents } from "@/lib/client-portal/backfill";

/**
 * POST /api/admin/client-events/backfill  (ADMIN only)
 * Map all historical review activity into client event feeds. Idempotent.
 * Used by scripts/backfill-client-events.mjs.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireUserFromRequest(request);
    assertAdmin(user);
    const body = (await request.json().catch(() => ({}))) as { clientId?: string };
    const result = await backfillClientEvents({ clientId: body.clientId ?? null });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error backfilling client events:", error);
    return toErrorResponse(error, { fallbackMessage: "Backfill failed" });
  }
}
