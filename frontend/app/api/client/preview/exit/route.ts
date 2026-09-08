import { NextRequest, NextResponse } from "next/server";
import { getClientContextFromRequest } from "@/lib/client-portal/session";
import { clearClientPreviewCookie } from "@/lib/client-portal/preview";
import { recordClientPortalAudit } from "@/lib/client-portal/audit";

/** POST /api/client/preview/exit — end an admin preview and return to the client record. */
export async function POST(request: NextRequest) {
  const ctx = await getClientContextFromRequest(request);
  const res = NextResponse.json({
    ok: true,
    redirectTo: ctx?.isPreview ? `/clients/${ctx.clientId}/portal` : "/dashboard",
  });
  clearClientPreviewCookie(res);
  if (ctx?.isPreview && ctx.previewActor) {
    await recordClientPortalAudit({
      action: "CLIENT_PORTAL_PREVIEW_ENDED",
      actor: { userId: ctx.previewActor.userId, name: ctx.previewActor.name },
      clientId: ctx.clientId,
      targetName: ctx.businessName,
    });
  }
  return res;
}
