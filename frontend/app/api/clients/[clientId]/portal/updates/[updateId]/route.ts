import { NextRequest, NextResponse } from "next/server";
import { requireClientPortalStaff } from "@/lib/client-portal/staff-access";
import { deleteClientUpdate, updateClientUpdate } from "@/lib/client-portal/updates";
import { clientUpdatePatchSchema } from "@/lib/client-portal/update-schema";
import { parseWithSchema } from "@/lib/api/validation";

interface RouteParams {
  params: Promise<{ clientId: string; updateId: string }>;
}

/** PATCH /api/clients/[clientId]/portal/updates/[updateId] */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { clientId, updateId } = await params;
  const access = await requireClientPortalStaff(request, clientId);
  if (access.denied) return access.denied;

  const parsed = await parseWithSchema(request, clientUpdatePatchSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const updated = await updateClientUpdate(access.clientId, updateId, access.user, parsed.data);
    if (!updated) return NextResponse.json({ error: "Update not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating client update:", error);
    return NextResponse.json({ error: "Failed to save update" }, { status: 500 });
  }
}

/** DELETE /api/clients/[clientId]/portal/updates/[updateId] — soft delete. */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { clientId, updateId } = await params;
  const access = await requireClientPortalStaff(request, clientId);
  if (access.denied) return access.denied;

  try {
    const ok = await deleteClientUpdate(access.clientId, updateId, access.user);
    if (!ok) return NextResponse.json({ error: "Update not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting client update:", error);
    return NextResponse.json({ error: "Failed to delete update" }, { status: 500 });
  }
}
