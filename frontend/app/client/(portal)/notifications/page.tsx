import { Suspense } from "react";
import dbConnect from "@/lib/mongodb";
import Notification from "@/models/Notification";
import { requireClientSession } from "@/lib/client-portal/session";
import { clientNotificationFilter, toNotificationItem } from "@/lib/client-portal/client-notifications";
import { clampPage, clampPageSize, paginate } from "@/lib/client-portal/dto";
import { PortalPageHeader, SectionCard } from "@/components/client-portal/ui/primitives";
import { PortalPagination } from "@/components/client-portal/ui/pagination";
import { NotificationsList } from "@/components/client-portal/notifications/notifications-list";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function ClientNotificationsPage({ searchParams }: { searchParams: SearchParams }) {
  const ctx = await requireClientSession();
  const sp = await searchParams;
  const page = clampPage(first(sp.page) ?? null);
  const pageSize = clampPageSize(first(sp.pageSize) ?? null, 20, 50);

  await dbConnect();
  const filter = clientNotificationFilter(ctx);
  const [total, docs] = await Promise.all([
    Notification.countDocuments(filter),
    Notification.find(filter)
      .select("_id type title message href isRead createdAt")
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
  ]);
  const result = paginate(
    docs.map((d) => toNotificationItem(d as Parameters<typeof toNotificationItem>[0])),
    page,
    pageSize,
    total,
  );

  return (
    <div className="space-y-6">
      <PortalPageHeader
        title="Notifications"
        subtitle="Alerts about your reviews, milestones and agency updates."
      />
      <SectionCard bodyClassName="space-y-4">
        <NotificationsList items={result.items} readOnly={ctx.isPreview} />
        <Suspense>
          <PortalPagination
            page={result.page}
            totalPages={result.totalPages}
            total={result.total}
            pageSize={result.pageSize}
            label="notifications"
          />
        </Suspense>
      </SectionCard>
    </div>
  );
}
