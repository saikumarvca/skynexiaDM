import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import PartnerAgency from "@/models/PartnerAgency";
import { parseWithSchema, apiError } from "@/lib/api/validation";
import { partnerAgencyPatchSchema } from "@/lib/api/schemas";
import { requireAnyPermissionApi } from "@/lib/team/require-permission-api";

function ensureScopedAccess(
  id: string,
  authz: Awaited<ReturnType<typeof requireAnyPermissionApi>>,
) {
  if (authz.perms.includes("manage_settings")) return true;
  return Boolean(authz.partnerAgencyId && authz.partnerAgencyId === id);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;
    const authz = await requireAnyPermissionApi(request, [
      "manage_settings",
      "manage_team",
      "assign_tasks",
      "assign_reviews",
    ]);
    if (authz.denied) return authz.denied;

    await dbConnect();
    const { id } = await params;
    if (!ensureScopedAccess(id, authz)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const item = await PartnerAgency.findOne({
      _id: id,
      isDeleted: { $ne: true },
    }).lean();
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(item);
  } catch (error) {
    console.error("Error fetching partner agency:", error);
    return apiError(500, "Failed to fetch partner agency", "INTERNAL_ERROR");
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;
    const authz = await requireAnyPermissionApi(request, ["manage_settings"]);
    if (authz.denied) return authz.denied;

    await dbConnect();
    const { id } = await params;
    const parsed = await parseWithSchema(request, partnerAgencyPatchSchema);
    if (!parsed.ok) return parsed.response;

    const updated = await PartnerAgency.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      { $set: parsed.data },
      { new: true },
    ).lean();
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating partner agency:", error);
    const code =
      error && typeof error === "object" && "code" in error
        ? (error as { code: unknown }).code
        : null;
    if (code === 11000) {
      return apiError(
        409,
        "Partner agency with same name/code already exists",
        "DUPLICATE_KEY",
      );
    }
    return apiError(500, "Failed to update partner agency", "INTERNAL_ERROR");
  }
}
