import { NextRequest, NextResponse } from "next/server";
import { requireClientPortalStaff } from "@/lib/client-portal/staff-access";
import { setClientPreviewCookie } from "@/lib/client-portal/preview";
import { recordClientPortalAudit } from "@/lib/client-portal/audit";
import { CLIENT_HOME_PATH } from "@/lib/client-portal/session";

interface RouteParams {
  params: Promise<{ clientId: string }>;
}

/**
 * POST /api/clients/[clientId]/portal/preview
 * Starts a read-only, time-limited preview of the client portal for the
 * signed-in admin/manager. Never touches the client's credentials.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { clientId } = await params;
  const access = await requireClientPortalStaff(request, clientId);
  if (access.denied) return access.denied;

  const res = NextResponse.json({ ok: true, redirectTo: CLIENT_HOME_PATH });
  setClientPreviewCookie(res, { uid: access.user.userId, cid: access.clientId });
  await recordClientPortalAudit({
    action: "CLIENT_PORTAL_PREVIEW_STARTED",
    actor: { userId: access.user.userId, name: access.user.name },
    clientId: access.clientId,
    targetName: access.clientName,
    details: { role: access.user.role },
  });
  return res;
}
