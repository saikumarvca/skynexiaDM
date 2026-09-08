import { NextRequest, NextResponse } from "next/server";
import { requireClientPortalStaff } from "@/lib/client-portal/staff-access";
import { backfillClientEvents } from "@/lib/client-portal/backfill";

interface RouteParams {
  params: Promise<{ clientId: string }>;
}

/**
 * POST /api/clients/[clientId]/portal/events/backfill
 * Map this client's historical review activity into the client event feed.
 * Idempotent; safe to run repeatedly.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { clientId } = await params;
  const access = await requireClientPortalStaff(request, clientId);
  if (access.denied) return access.denied;

  try {
    const result = await backfillClientEvents({ clientId: access.clientId });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error backfilling client events:", error);
    return NextResponse.json({ error: "Backfill failed" }, { status: 500 });
  }
}
