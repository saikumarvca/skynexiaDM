import { Suspense } from "react";
import { requireClientSession } from "@/lib/client-portal/session";
import { parseClientDateRange } from "@/lib/client-portal/date-range";
import { listClientReviews } from "@/lib/client-portal/reviews";
import {
  CLIENT_REVIEW_STATUSES,
  clampPage,
  clampPageSize,
  type ClientReviewStatus,
} from "@/lib/client-portal/dto";
import { PortalPageHeader, SectionCard } from "@/components/client-portal/ui/primitives";
import { PortalPagination } from "@/components/client-portal/ui/pagination";
import { ReviewFilters, ReviewStatusTabs } from "@/components/client-portal/reviews/reviews-filters";
import { ReviewsTable } from "@/components/client-portal/reviews/reviews-table";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function ClientReviewsPage({ searchParams }: { searchParams: SearchParams }) {
  const ctx = await requireClientSession();
  const sp = await searchParams;

  const statusRaw = (first(sp.status) ?? "").toUpperCase();
  const status = CLIENT_REVIEW_STATUSES.includes(statusRaw as ClientReviewStatus)
    ? (statusRaw as ClientReviewStatus)
    : null;
  const rangeKey = first(sp.range) ?? "all";
  const range =
    rangeKey !== "all"
      ? parseClientDateRange({ range: rangeKey, from: first(sp.from), to: first(sp.to) })
      : null;
  const page = clampPage(first(sp.page) ?? null);
  const pageSize = clampPageSize(first(sp.pageSize) ?? null, 10, 50);
  const platform = first(sp.platform) ?? "";
  const search = first(sp.search) ?? "";

  const result = await listClientReviews(ctx.clientId, {
    status,
    platform,
    search,
    from: range?.from ?? null,
    to: range?.to ?? null,
    page,
    pageSize,
  });

  return (
    <div className="space-y-6">
      <PortalPageHeader title="Reviews" subtitle="View the status and details of your reviews." />
      <SectionCard bodyClassName="space-y-4">
        <Suspense>
          <ReviewStatusTabs active={status} counts={result.counts} />
          <ReviewFilters
            platforms={result.platforms}
            platform={platform}
            search={search}
            range={range ? range.key : "all"}
            from={range?.fromIso}
            to={range?.toIso}
          />
        </Suspense>
        <ReviewsTable items={result.items} startIndex={(result.page - 1) * result.pageSize + 1} />
        <Suspense>
          <PortalPagination
            page={result.page}
            totalPages={result.totalPages}
            total={result.total}
            pageSize={result.pageSize}
            label="reviews"
          />
        </Suspense>
      </SectionCard>
    </div>
  );
}
