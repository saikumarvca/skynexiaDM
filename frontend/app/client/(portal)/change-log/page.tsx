import { Suspense } from "react";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { requireClientSession } from "@/lib/client-portal/session";
import { parseClientDateRange } from "@/lib/client-portal/date-range";
import { getClientChangeLog } from "@/lib/client-portal/change-log";
import { clampPage, clampPageSize, PORTAL_CATEGORY_LABEL } from "@/lib/client-portal/dto";
import { formatDateTime } from "@/components/client-portal/format";
import {
  ActorChip,
  EmptyState,
  PortalPageHeader,
  SectionCard,
} from "@/components/client-portal/ui/primitives";
import { PortalPagination } from "@/components/client-portal/ui/pagination";
import { ChangeLogFilters } from "@/components/client-portal/change-log/change-log-filters";
import { ActivityIcon } from "@/components/client-portal/activity-icon";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const CATEGORY_PILL: Record<string, string> = {
  REVIEW: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  DATA: "bg-sky-500/12 text-sky-700 dark:text-sky-300",
  FEATURE: "bg-violet-500/12 text-violet-700 dark:text-violet-300",
  SYSTEM: "bg-slate-500/12 text-slate-700 dark:text-slate-300",
};

export default async function ClientChangeLogPage({ searchParams }: { searchParams: SearchParams }) {
  const ctx = await requireClientSession();
  const sp = await searchParams;
  const rangeKey = first(sp.range) ?? "all";
  const range =
    rangeKey !== "all"
      ? parseClientDateRange({ range: rangeKey, from: first(sp.from), to: first(sp.to) })
      : null;
  const category = (first(sp.category) ?? "").toUpperCase();
  const role = (first(sp.role) ?? "").toUpperCase();
  const search = first(sp.search) ?? "";

  const result = await getClientChangeLog(ctx.clientId, {
    category,
    role,
    from: range?.from ?? null,
    to: range?.to ?? null,
    search,
    page: clampPage(first(sp.page) ?? null),
    pageSize: clampPageSize(first(sp.pageSize) ?? null, 10, 50),
  });

  return (
    <div className="space-y-6">
      <PortalPageHeader
        title="Change Log"
        subtitle="See what changes and updates have been made for your account."
      />
      <SectionCard bodyClassName="space-y-4">
        <Suspense>
          <ChangeLogFilters
            category={category}
            role={role}
            search={search}
            range={range ? range.key : "all"}
            from={range?.fromIso}
            to={range?.toIso}
          />
        </Suspense>

        {result.items.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No changes recorded"
            description="Client-visible activity from your agency team will appear here."
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto rounded-lg border md:block">
              <table className="w-full min-w-[860px] text-sm">
                <thead className="bg-muted/50 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Date &amp; Time</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Change Description</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Related Item</th>
                    <th className="px-4 py-3 text-right">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {result.items.map((e) => (
                    <tr key={e.id} className="align-top transition-colors hover:bg-muted/40">
                      <td className="whitespace-nowrap px-4 py-3 tabular-nums text-muted-foreground">
                        {formatDateTime(e.occurredAt)}
                      </td>
                      <td className="px-4 py-3">
                        <ActorChip name={e.actorName} role={e.actorRole} />
                      </td>
                      <td className="max-w-[360px] px-4 py-3">
                        <div className="flex items-start gap-2.5">
                          <ActivityIcon action={e.action} category={e.category} size="sm" />
                          <span className="min-w-0">
                            <span className="block font-medium">{e.title}</span>
                            <span className="block text-xs text-muted-foreground">{e.description}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${CATEGORY_PILL[e.category]}`}
                        >
                          {PORTAL_CATEGORY_LABEL[e.category]}
                        </span>
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-muted-foreground">
                        {e.relatedLabel ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {e.relatedReviewId ? (
                          <Link
                            href={`/client/reviews/${e.relatedReviewId}`}
                            className="inline-flex h-8 items-center rounded-md border border-primary/40 px-3 text-xs font-semibold text-primary no-underline hover:bg-primary/10"
                          >
                            View
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="space-y-3 md:hidden">
              {result.items.map((e) => (
                <li key={e.id} className="rounded-xl border bg-card p-4">
                  <div className="flex items-start gap-3">
                    <ActivityIcon action={e.action} category={e.category} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{e.title}</p>
                      <p className="text-xs text-muted-foreground">{e.description}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="tabular-nums">{formatDateTime(e.occurredAt)}</span>
                        <span
                          className={`inline-flex rounded-md px-2 py-0.5 font-semibold ${CATEGORY_PILL[e.category]}`}
                        >
                          {PORTAL_CATEGORY_LABEL[e.category]}
                        </span>
                      </div>
                      <div className="mt-2">
                        <ActorChip name={e.actorName} role={e.actorRole} compact />
                      </div>
                      {e.relatedReviewId ? (
                        <Link
                          href={`/client/reviews/${e.relatedReviewId}`}
                          className="mt-2 inline-flex text-xs font-semibold text-primary no-underline"
                        >
                          View review →
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        <Suspense>
          <PortalPagination
            page={result.page}
            totalPages={result.totalPages}
            total={result.total}
            pageSize={result.pageSize}
            label="changes"
          />
        </Suspense>
      </SectionCard>
    </div>
  );
}
