import { NextRequest, NextResponse } from "next/server";
import { requireClientSessionApi } from "@/lib/client-portal/session";
import { listClientUpdates } from "@/lib/client-portal/updates";
import { clampPage, clampPageSize } from "@/lib/client-portal/dto";

/** GET /api/client/updates?page=&pageSize=&unreadOnly=true */
export async function GET(request: NextRequest) {
  const auth = await requireClientSessionApi(request);
  if (auth.denied) return auth.denied;

  try {
    const { searchParams } = new URL(request.url);
    const result = await listClientUpdates(auth.ctx, {
      page: clampPage(searchParams.get("page")),
      pageSize: clampPageSize(searchParams.get("pageSize")),
      unreadOnly: searchParams.get("unreadOnly") === "true",
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error loading client updates:", error);
    return NextResponse.json({ error: "Failed to load updates" }, { status: 500 });
  }
}
