import { NextRequest, NextResponse } from "next/server";
import { requireClientPortalStaff } from "@/lib/client-portal/staff-access";
import { resetClientLoginPassword } from "@/lib/client-portal/logins";

interface RouteParams {
  params: Promise<{ clientId: string; userId: string }>;
}

/**
 * POST /api/clients/[clientId]/portal/users/[userId]/reset-password
 * Issues a temporary password (returned once), signs the login out
 * everywhere and forces a password change at the next sign-in.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { clientId, userId } = await params;
  const access = await requireClientPortalStaff(request, clientId);
  if (access.denied) return access.denied;

  try {
    const body = (await request.json().catch(() => ({}))) as { sendEmail?: unknown };
    const result = await resetClientLoginPassword(access.clientId, userId, access.clientName, access.user, {
      sendEmail: body.sendEmail !== false,
    });
    if (!result) return NextResponse.json({ error: "Login not found" }, { status: 404 });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error resetting client login password:", error);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
