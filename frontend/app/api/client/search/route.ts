import { NextRequest, NextResponse } from "next/server";
import { requireClientSessionApi } from "@/lib/client-portal/session";
import { searchClientPortal } from "@/lib/client-portal/search";

/** GET /api/client/search?q= — reviews, updates and activity of this client only. */
export async function GET(request: NextRequest) {
  const auth = await requireClientSessionApi(request);
  if (auth.denied) return auth.denied;

  try {
    const { searchParams } = new URL(request.url);
    const result = await searchClientPortal(auth.ctx.clientId, searchParams.get("q") ?? "");
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error searching client portal:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
