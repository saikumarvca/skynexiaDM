import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import { requireAnyPermissionApi } from "@/lib/team/require-permission-api";
import { resolveUserHierarchyContext } from "@/lib/team/scope-filters";
import { parseFlexibleDateParam, toDdMmYyyyDisplay } from "@/lib/date-format";
import { toCsv } from "@/lib/csv";
import {
  DailyProgressScopeError,
  getReviewDailyProgress,
  normalizeDailyProgressRange,
} from "@/lib/reviews/daily-progress";

/**
 * GET /api/review-analytics/daily-progress
 *   ?clientId=<id|ALL>      optional — omit or ALL for every client in scope
 *   &memberId=<id|ALL>      optional — restrict to one team member (assignee);
 *                            use UNASSIGNED for allocations without an assignee
 *   &dateFrom=yyyy-mm-dd    optional (dd-mm-yyyy also accepted)
 *   &dateTo=yyyy-mm-dd      optional — defaults to today
 *   &format=csv             optional — download the daily table as CSV
 */
export async function GET(request: NextRequest) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    const authz = await requireAnyPermissionApi(request, [
      "view_analytics",
      "manage_reviews",
      "assign_reviews",
      "view_reviews",
    ]);
    if (authz.denied) return authz.denied;

    const ctx = resolveUserHierarchyContext(authz);

    const { searchParams } = new URL(request.url);
    const rawClientId = searchParams.get("clientId")?.trim() ?? "";
    const clientId = rawClientId && rawClientId !== "ALL" ? rawClientId : null;
    const rawMemberId = searchParams.get("memberId")?.trim() ?? "";
    const memberId = rawMemberId && rawMemberId !== "ALL" ? rawMemberId : null;
    const range = normalizeDailyProgressRange(
      parseFlexibleDateParam(searchParams.get("dateFrom") ?? undefined),
      parseFlexibleDateParam(searchParams.get("dateTo") ?? undefined),
    );

    let result;
    try {
      result = await getReviewDailyProgress({
        clientId,
        memberId,
        from: range.from,
        to: range.to,
        scope: {
          isAdmin: ctx.isAdmin,
          accountType: ctx.accountType,
          partnerAgencyId: ctx.partnerAgencyId,
          assignedClientIds: ctx.assignedClientIds,
        },
      });
    } catch (error) {
      if (error instanceof DailyProgressScopeError) {
        return NextResponse.json(
          { error: "Client is outside your scope" },
          { status: 403 },
        );
      }
      throw error;
    }

    if (searchParams.get("format") === "csv") {
      const rows = result.days.map((d) => [
        toDdMmYyyyDisplay(d.date),
        String(d.shared),
        String(d.posted),
      ]);
      rows.push(["Total", String(result.totals.shared), String(result.totals.posted)]);
      const csv = toCsv(["Date", "Shared with customer", "Posted"], rows);
      const memberName = memberId ? result.members[0]?.name ?? memberId : "";
      const suffix =
        (clientId ? `-${clientId}` : "") +
        (memberName ? `-${memberName.replace(/[^\w.-]+/g, "_")}` : "");
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="review-daily-progress${suffix}-${result.from}-to-${result.to}.csv"`,
        },
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching review daily progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch review daily progress" },
      { status: 500 },
    );
  }
}
