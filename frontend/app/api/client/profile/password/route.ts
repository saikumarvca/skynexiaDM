import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import {
  CLIENT_HOME_PATH,
  denyIfPreview,
  freshClientSessionToken,
  requireClientSessionApi,
} from "@/lib/client-portal/session";
import { setSessionCookie } from "@/lib/session-cookie";
import { recordClientPortalAudit } from "@/lib/client-portal/audit";

/** POST /api/client/profile/password { currentPassword, newPassword } */
export async function POST(request: NextRequest) {
  const auth = await requireClientSessionApi(request);
  if (auth.denied) return auth.denied;
  const readOnly = denyIfPreview(auth.ctx);
  if (readOnly) return readOnly;
  const { ctx } = auth;

  try {
    const body = (await request.json().catch(() => ({}))) as {
      currentPassword?: string;
      newPassword?: string;
    };
    const currentPassword = body.currentPassword ?? "";
    const newPassword = body.newPassword ?? "";
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "currentPassword and newPassword are required" },
        { status: 400 },
      );
    }
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters" },
        { status: 400 },
      );
    }
    if (newPassword === currentPassword) {
      return NextResponse.json(
        { error: "New password must differ from the current password" },
        { status: 400 },
      );
    }

    await dbConnect();
    const user = await User.findOne({ _id: ctx.userId, role: "CLIENT" }).select(
      "passwordHash mustChangePassword passwordChangedAt sessionsRevokedAt",
    );
    if (!user?.passwordHash) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    // Every other session of this login is signed out; this one gets a fresh
    // cookie so the person changing the password stays signed in.
    const now = new Date();
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.mustChangePassword = false;
    user.passwordChangedAt = now;
    user.sessionsRevokedAt = now;
    await user.save();

    await recordClientPortalAudit({
      action: "CLIENT_PASSWORD_CHANGED",
      actor: { userId: ctx.userId, name: ctx.name },
      clientId: ctx.clientId,
      details: { email: ctx.email },
    });

    const res = NextResponse.json({
      message: "Password updated successfully",
      otherSessionsSignedOut: true,
      redirectTo: CLIENT_HOME_PATH,
    });
    setSessionCookie(res, freshClientSessionToken(ctx));
    return res;
  } catch (error) {
    console.error("Error changing client password:", error);
    return NextResponse.json({ error: "Failed to change password" }, { status: 500 });
  }
}
