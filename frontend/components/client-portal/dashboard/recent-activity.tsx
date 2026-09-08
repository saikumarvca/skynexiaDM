import Link from "next/link";
import { Activity, ArrowRight } from "lucide-react";
import { ActivityIcon } from "@/components/client-portal/activity-icon";
import { timeAgo } from "@/components/client-portal/format";
import { EmptyState, SectionCard } from "@/components/client-portal/ui/primitives";
import { PORTAL_ACTOR_ROLE_LABEL, type ClientActivityItem } from "@/lib/client-portal/dto";

export function RecentActivity({ items }: { items: ClientActivityItem[] }) {
  return (
    <SectionCard
      title="Recent Activity"
      actions={
        <Link
          href="/client/change-log"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary no-underline"
        >
          View All
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      }
      className="h-full"
    >
      {items.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No activity yet"
          description="Updates from your agency team will appear here."
          className="py-8"
        />
      ) : (
        <ol className="space-y-4">
          {items.map((item) => {
            const body = (
              <>
                <ActivityIcon action={item.action} category={item.category} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold leading-snug">
                    {item.title}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    by {item.actorName || PORTAL_ACTOR_ROLE_LABEL[item.actorRole]}
                    {item.actorName ? ` (${PORTAL_ACTOR_ROLE_LABEL[item.actorRole]})` : ""}
                  </span>
                </span>
                <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">
                  {timeAgo(item.occurredAt)}
                </span>
              </>
            );
            return (
              <li key={item.id}>
                {item.relatedReviewId ? (
                  <Link
                    href={`/client/reviews/${item.relatedReviewId}`}
                    className="flex items-start gap-3 rounded-lg text-foreground no-underline transition-colors hover:bg-muted/60"
                  >
                    {body}
                  </Link>
                ) : (
                  <div className="flex items-start gap-3">{body}</div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </SectionCard>
  );
}
