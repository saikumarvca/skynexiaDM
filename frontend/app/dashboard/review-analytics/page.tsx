import { DashboardLayout } from "@/components/dashboard-layout";
import { ReviewAnalyticsClient } from "@/components/review-analytics/review-analytics-client";
import {
  DailyProgressCard,
  type DailyProgressClientOption,
} from "@/components/review-analytics/daily-progress-card";
import { serverFetch } from "@/lib/server-fetch";
import dbConnect from "@/lib/mongodb";
import ClientModel from "@/models/Client";
import { parseFlexibleDateParam } from "@/lib/date-format";
import {
  normalizeDailyProgressRange,
  type DailyProgressResult,
} from "@/lib/reviews/daily-progress";
import { getCurrentUserTeamPermissions } from "@/lib/team/current-user-permissions";
import {
  buildClientScopeFilter,
  resolveUserHierarchyContext,
} from "@/lib/team/scope-filters";

async function getAnalytics() {
  try {
    const res = await serverFetch("/api/review-analytics");
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function getDailyProgress(params: {
  clientId?: string;
  from: string;
  to: string;
}): Promise<DailyProgressResult | null> {
  try {
    const qs = new URLSearchParams({ dateFrom: params.from, dateTo: params.to });
    if (params.clientId) qs.set("clientId", params.clientId);
    const res = await serverFetch(
      `/api/review-analytics/daily-progress?${qs.toString()}`,
    );
    if (!res.ok) return null;
    return (await res.json()) as DailyProgressResult;
  } catch {
    return null;
  }
}

/** Clients the current user may pick from (admins see all). */
async function getClientOptions(): Promise<DailyProgressClientOption[]> {
  try {
    const team = await getCurrentUserTeamPermissions();
    const ctx = resolveUserHierarchyContext({
      perms: team.permissions,
      teamMemberId: team.teamMemberId,
      agencyId: team.agencyId,
      agencyKind: team.agencyKind,
      accountType: team.accountType,
      partnerAgencyId: team.partnerAgencyId,
      assignedClientIds: team.assignedClientIds,
    });
    await dbConnect();
    const docs = await ClientModel.find({
      ...buildClientScopeFilter(ctx),
      status: { $ne: "ARCHIVED" },
    })
      .select("name businessName")
      .sort({ name: 1 })
      .limit(500)
      .lean();
    return docs.map((c) => {
      const name = String(c.name ?? "").trim();
      const business = String(c.businessName ?? "").trim();
      const label =
        business && business.toLowerCase() !== name.toLowerCase()
          ? `${name} — ${business}`
          : name || business;
      return { id: String(c._id), label };
    });
  } catch (error) {
    console.error("Error loading clients for review analytics:", error);
    return [];
  }
}

interface PageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function ReviewAnalyticsPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const rawClientId = firstParam(params.clientId)?.trim();
  const clientId = rawClientId && rawClientId !== "ALL" ? rawClientId : undefined;
  const range = normalizeDailyProgressRange(
    parseFlexibleDateParam(firstParam(params.dateFrom)),
    parseFlexibleDateParam(firstParam(params.dateTo)),
  );

  const [data, clients, dailyProgress] = await Promise.all([
    getAnalytics(),
    getClientOptions(),
    getDailyProgress({ clientId, from: range.from, to: range.to }),
  ]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Review Analytics
          </h1>
          <p className="text-muted-foreground">
            Overview of review drafts, allocations, and usage.
          </p>
        </div>

        <DailyProgressCard
          initialData={dailyProgress}
          clients={clients}
          initialClientId={clientId ?? null}
          syncUrl
        />

        <ReviewAnalyticsClient initialData={data} />
      </div>
    </DashboardLayout>
  );
}
