import { NextRequest, NextResponse } from "next/server";
import { requireClientSessionApi } from "@/lib/client-portal/session";

/** GET /api/client/profile — the signed-in client account and its client record. */
export async function GET(request: NextRequest) {
  const auth = await requireClientSessionApi(request);
  if (auth.denied) return auth.denied;
  const { ctx } = auth;
  return NextResponse.json({
    account: { id: ctx.userId, name: ctx.name, email: ctx.email },
    client: ctx.client,
    isPreview: ctx.isPreview,
    previewActor: ctx.previewActor
      ? { name: ctx.previewActor.name, role: ctx.previewActor.role }
      : null,
  });
}
