import Link from "next/link";
import { Star } from "lucide-react";
import { formatDate } from "@/components/client-portal/format";
import { EmptyState, RatingStars, StatusPill } from "@/components/client-portal/ui/primitives";
import type { ClientReviewListItem } from "@/lib/client-portal/dto";

export function ReviewsTable({
  items,
  startIndex,
}: {
  items: ClientReviewListItem[];
  startIndex: number;
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={Star}
        title="No reviews match"
        description="Try another status, platform or date range."
      />
    );
  }
  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-lg border md:block">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-muted/50 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">#</th>
              <th className="px-4 py-3 font-semibold">Customer Name</th>
              <th className="px-4 py-3 font-semibold">Platform</th>
              <th className="px-4 py-3 font-semibold">Rating</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Shared Date</th>
              <th className="px-4 py-3 font-semibold">Posted Date</th>
              <th className="px-4 py-3 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((r, i) => (
              <tr key={r.id} className="transition-colors hover:bg-muted/40">
                <td className="px-4 py-3 tabular-nums text-muted-foreground">{startIndex + i}</td>
                <td className="max-w-[260px] px-4 py-3">
                  <span className="block truncate font-medium">
                    {r.customerName ?? (r.kind === "draft" ? "Not yet assigned" : "—")}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground" title={r.subject}>
                    {r.subject}
                  </span>
                </td>
                <td className="px-4 py-3">{r.platform ?? "—"}</td>
                <td className="px-4 py-3">
                  <RatingStars rating={r.rating} />
                </td>
                <td className="px-4 py-3">
                  <StatusPill status={r.status} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 tabular-nums">{formatDate(r.sharedDate)}</td>
                <td className="whitespace-nowrap px-4 py-3 tabular-nums">{formatDate(r.postedDate)}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/client/reviews/${r.id}`}
                    className="inline-flex h-8 items-center rounded-md border border-primary/40 px-3 text-xs font-semibold text-primary no-underline transition-colors hover:bg-primary/10"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="space-y-3 md:hidden">
        {items.map((r, i) => (
          <li key={r.id}>
            <Link
              href={`/client/reviews/${r.id}`}
              className="block rounded-xl border bg-card p-4 text-foreground no-underline transition-colors hover:bg-muted/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">#{startIndex + i}</p>
                  <p className="truncate font-semibold">
                    {r.customerName ?? (r.kind === "draft" ? "Not yet assigned" : "—")}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{r.subject}</p>
                </div>
                <StatusPill status={r.status} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Platform</p>
                  <p className="font-medium">{r.platform ?? "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Rating</p>
                  <RatingStars rating={r.rating} size={12} />
                </div>
                <div>
                  <p className="text-muted-foreground">Shared</p>
                  <p className="font-medium tabular-nums">{formatDate(r.sharedDate)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Posted</p>
                  <p className="font-medium tabular-nums">{formatDate(r.postedDate)}</p>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
