import { NextRequest, NextResponse } from "next/server";
import { requireClientPortalStaff } from "@/lib/client-portal/staff-access";
import { updateClientLogin } from "@/lib/client-portal/logins";
import { updateClientLoginSchema } from "@/lib/client-portal/login-schema";
import { parseWithSchema } from "@/lib/api/validation";

interface RouteParams {
  params: Promise<{ clientId: string; userId: string }>;
}

/**
 * PATCH /api/clients/[clientId]/portal/users/[userId] { name?, isActive? }
 * Deactivating a login signs it out everywhere immediately.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { clientId, userId } = await params;
  const access = await requireClientPortalStaff(request, clientId);
  if (access.denied) return access.denied;

  const parsed = await parseWithSchema(request, updateClientLoginSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const updated = await updateClientLogin(access.clientId, userId, parsed.data, access.user);
    if (!updated) return NextResponse.json({ error: "Login not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating client login:", error);
    return NextResponse.json({ error: "Failed to update client login" }, { status: 500 });
  }
}
