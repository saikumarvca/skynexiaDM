import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import PartnerAgency from "@/models/PartnerAgency";
import { parseWithSchema, apiError } from "@/lib/api/validation";
import { partnerAgencyCreateSchema } from "@/lib/api/schemas";
import { requireAnyPermissionApi } from "@/lib/team/require-permission-api";

export async function GET(request: NextRequest) {
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

    const query: Record<string, unknown> = { isDeleted: { $ne: true } };
    const canSeeAll = authz.perms.includes("manage_settings");
    if (!canSeeAll) {
      if (!authz.partnerAgencyId) {
        return NextResponse.json({ items: [] });
      }
      query._id = authz.partnerAgencyId;
    }

    const items = await PartnerAgency.find(query).sort({ name: 1 }).lean();
    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error fetching partner agencies:", error);
    return apiError(500, "Failed to fetch partner agencies", "INTERNAL_ERROR");
  }
}

export async function POST(request: NextRequest) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;
    const authz = await requireAnyPermissionApi(request, ["manage_settings"]);
    if (authz.denied) return authz.denied;

    await dbConnect();
    const parsed = await parseWithSchema(request, partnerAgencyCreateSchema);
    if (!parsed.ok) return parsed.response;

    const doc = await PartnerAgency.create({
      ...parsed.data,
      status: parsed.data.status ?? "ACTIVE",
    });
    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    console.error("Error creating partner agency:", error);
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
    return apiError(500, "Failed to create partner agency", "INTERNAL_ERROR");
  }
}
