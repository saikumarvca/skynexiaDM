import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import TeamMember from "@/models/TeamMember";
import { requireAnyPermissionApi } from "@/lib/team/require-permission-api";
import { apiError } from "@/lib/api/validation";

function canViewAgencyEmployees(
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

    const { id } = await params;
    if (!canViewAgencyEmployees(id, authz)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();
    const items = await TeamMember.find({
      isDeleted: { $ne: true },
      partnerAgencyId: id,
      accountType: { $in: ["PARTNER_AGENCY", "PARTNER_EMPLOYEE"] },
    })
      .sort({ name: 1 })
      .populate("roleId", "roleName permissions")
      .lean();
    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error fetching partner agency employees:", error);
    return apiError(
      500,
      "Failed to fetch partner agency employees",
      "INTERNAL_ERROR",
    );
  }
}
