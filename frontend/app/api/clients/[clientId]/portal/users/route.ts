import { NextRequest, NextResponse } from "next/server";
import { requireClientPortalStaff } from "@/lib/client-portal/staff-access";
import { ClientLoginEmailTakenError, createClientLogin, listClientLogins } from "@/lib/client-portal/logins";
import { createClientLoginSchema } from "@/lib/client-portal/login-schema";
import { parseWithSchema } from "@/lib/api/validation";

interface RouteParams {
  params: Promise<{ clientId: string }>;
}

/** GET /api/clients/[clientId]/portal/users — CLIENT logins linked to this client. */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { clientId } = await params;
  const access = await requireClientPortalStaff(request, clientId);
  if (access.denied) return access.denied;

  try {
    return NextResponse.json(await listClientLogins(access.clientId));
  } catch (error) {
    console.error("Error listing client logins:", error);
    return NextResponse.json({ error: "Failed to load client logins" }, { status: 500 });
  }
}

/**
 * POST /api/clients/[clientId]/portal/users { email, name?, sendInvite? }
 * Creates a login with a temporary password, returned once in the response.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { clientId } = await params;
  const access = await requireClientPortalStaff(request, clientId);
  if (access.denied) return access.denied;

  const parsed = await parseWithSchema(request, createClientLoginSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const created = await createClientLogin(access.clientId, access.clientName, parsed.data, access.user);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof ClientLoginEmailTakenError) {
      return NextResponse.json({ error: error.message, code: "CONFLICT" }, { status: 409 });
    }
    console.error("Error creating client login:", error);
    return NextResponse.json({ error: "Failed to create client login" }, { status: 500 });
  }
}
