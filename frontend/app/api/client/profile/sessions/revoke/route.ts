import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import {
  denyIfPreview,
  freshClientSessionToken,
  requireClientSessionApi,
} from "@/lib/client-portal/session";
import { recordClientPortalAudit } from "@/lib/client-portal/audit";
import { setSessionCookie } from "@/lib/session-cookie";

/**
 * POST /api/client/profile/sessions/revoke — "sign out everywhere else".
 * Every session token issued before now stops working; the caller gets a
 * fresh cookie so this browser stays signed in.
 */
export async function POST(request: NextRequest) {
  const auth = await requireClientSessionApi(request);
  if (auth.denied) return auth.denied;
  const readOnly = denyIfPreview(auth.ctx);
  if (readOnly) return readOnly;
  const { ctx } = auth;

  try {
    await dbConnect();
    const result = await User.updateOne(
      { _id: ctx.userId, role: "CLIENT" },
      { $set: { sessionsRevokedAt: new Date() } },
    );
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }
    await recordClientPortalAudit({
      action: "CLIENT_SESSIONS_REVOKED",
      actor: { userId: ctx.userId, name: ctx.name },
      clientId: ctx.clientId,
      details: { email: ctx.email, by: "self" },
    });
    const res = NextResponse.json({ ok: true, otherSessionsSignedOut: true });
    setSessionCookie(res, freshClientSessionToken(ctx));
    return res;
  } catch (error) {
    console.error("Error revoking client sessions:", error);
    return NextResponse.json({ error: "Failed to sign out other sessions" }, { status: 500 });
  }
}
