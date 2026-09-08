import { Suspense } from "react";
import { requireClientSession } from "@/lib/client-portal/session";
import { listClientUpdates } from "@/lib/client-portal/updates";
import { clampPage, clampPageSize } from "@/lib/client-portal/dto";
import { PortalPageHeader, SectionCard } from "@/components/client-portal/ui/primitives";
import { PortalPagination } from "@/components/client-portal/ui/pagination";
import { UpdatesList } from "@/components/client-portal/updates/updates-list";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function ClientUpdatesPage({ searchParams }: { searchParams: SearchParams }) {
  const ctx = await requireClientSession();
  const sp = await searchParams;
  const result = await listClientUpdates(ctx, {
    page: clampPage(first(sp.page) ?? null),
    pageSize: clampPageSize(first(sp.pageSize) ?? null, 10, 50),
  });

  return (
    <div className="space-y-6">
      <PortalPageHeader
        title="Updates & Announcements"
        subtitle={
          result.unread > 0
            ? `${result.unread} unread update${result.unread === 1 ? "" : "s"} from your agency team.`
            : "News, progress notes and announcements from your agency team."
        }
      />
      <SectionCard bodyClassName="space-y-4">
        <UpdatesList items={result.items} openId={first(sp.open)} readOnly={ctx.isPreview} />
        <Suspense>
          <PortalPagination
            page={result.page}
            totalPages={result.totalPages}
            total={result.total}
            pageSize={result.pageSize}
            label="updates"
          />
        </Suspense>
      </SectionCard>
    </div>
  );
}
