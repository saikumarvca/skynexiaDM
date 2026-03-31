import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import { requireAnyPermissionApi } from "@/lib/team/require-permission-api";
import dbConnect from "@/lib/mongodb";
import ReviewAllocation from "@/models/ReviewAllocation";
import { apiError } from "@/lib/api/validation";

/**
 * PATCH /api/review-allocations/bulk-patch
 *
 * Bulk-update platform on all active allocations for a set of draft IDs.
 * Replaces the previous N+1 per-allocation PATCH pattern in the client.
 *
 * Body:
 *   { draftIds: string[], platform: string }
 *
 * Returns:
 *   { modifiedCount: number }
 */
export async function PATCH(request: NextRequest) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    const authz = await requireAnyPermissionApi(request, [
      "manage_reviews",
      "assign_reviews",
    ]);
    if (authz.denied) return authz.denied;

    await dbConnect();

    const body = await request.json().catch(() => null);
    if (!body || !Array.isArray(body.draftIds) || !body.platform) {
      return apiError(
        400,
        "draftIds (array) and platform (string) are required",
        "VALIDATION_ERROR",
      );
    }

    const { draftIds, platform } = body as {
      draftIds: string[];
      platform: string;
    };

    if (draftIds.length === 0) {
      return NextResponse.json({ modifiedCount: 0 });
    }

    const result = await ReviewAllocation.updateMany(
      {
        draftId: { $in: draftIds },
        allocationStatus: { $nin: ["Cancelled", "Posted", "Used"] },
      },
      { $set: { platform: platform.trim(), updatedAt: new Date() } },
    );

    return NextResponse.json({ modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error("Error bulk-patching review allocations:", error);
    const msg =
      error instanceof Error ? error.message : "Failed to bulk patch allocations";
    return apiError(500, msg, "INTERNAL_ERROR");
  }
}
