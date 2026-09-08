import { NextRequest, NextResponse } from "next/server";
import { requireClientPortalStaff } from "@/lib/client-portal/staff-access";
import {
  createClientUpdate,
  listClientUpdatesForStaff,
} from "@/lib/client-portal/updates";
import { clientUpdateSchema } from "@/lib/client-portal/update-schema";
import { clampPage, clampPageSize } from "@/lib/client-portal/dto";
import { parseWithSchema } from "@/lib/api/validation";

interface RouteParams {
  params: Promise<{ clientId: string }>;
}

/** GET /api/clients/[clientId]/portal/updates — all updates (published and drafts). */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { clientId } = await params;
  const access = await requireClientPortalStaff(request, clientId);
  if (access.denied) return access.denied;

  try {
    const { searchParams } = new URL(request.url);
    const result = await listClientUpdatesForStaff(access.clientId, {
      page: clampPage(searchParams.get("page")),
      pageSize: clampPageSize(searchParams.get("pageSize")),
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error listing client updates:", error);
    return NextResponse.json({ error: "Failed to load updates" }, { status: 500 });
  }
}

/** POST /api/clients/[clientId]/portal/updates — publish (or draft) an update. */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { clientId } = await params;
  const access = await requireClientPortalStaff(request, clientId);
  if (access.denied) return access.denied;

  const parsed = await parseWithSchema(request, clientUpdateSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const created = await createClientUpdate(access.clientId, access.user, parsed.data);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Error creating client update:", error);
    return NextResponse.json({ error: "Failed to create update" }, { status: 500 });
  }
}
