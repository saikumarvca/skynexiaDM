import { NextRequest, NextResponse } from "next/server";
import { denyIfPreview, requireClientSessionApi } from "@/lib/client-portal/session";
import { markClientUpdateRead } from "@/lib/client-portal/updates";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** POST /api/client/updates/[id]/read */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const auth = await requireClientSessionApi(request);
  if (auth.denied) return auth.denied;
  const readOnly = denyIfPreview(auth.ctx);
  if (readOnly) return readOnly;

  try {
    const { id } = await params;
    const update = await markClientUpdateRead(auth.ctx, id);
    if (!update) {
      return NextResponse.json({ error: "Update not found" }, { status: 404 });
    }
    return NextResponse.json(update);
  } catch (error) {
    console.error("Error marking client update read:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
