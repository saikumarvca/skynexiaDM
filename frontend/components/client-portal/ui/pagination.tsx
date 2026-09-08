"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** URL-driven pagination that keeps every other query parameter. */
export function PortalPagination({
  page,
  totalPages,
  total,
  pageSize,
  label = "items",
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  label?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const hrefFor = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (p <= 1) params.delete("page");
    else params.set("page", String(p));
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  const pages: (number | "…")[] = [];
  const push = (p: number | "…") => pages.push(p);
  if (totalPages <= 7) {
    for (let p = 1; p <= totalPages; p += 1) push(p);
  } else {
    push(1);
    if (page > 3) push("…");
    for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p += 1) push(p);
    if (page < totalPages - 2) push("…");
    push(totalPages);
  }

  const btn =
    "inline-flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-sm no-underline transition-colors";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Showing {from} to {to} of {total} {label}
      </p>
      {totalPages > 1 ? (
        <nav aria-label="Pagination" className="flex items-center gap-1">
          <Link
            href={hrefFor(page - 1)}
            aria-disabled={page <= 1}
            className={cn(btn, page <= 1 && "pointer-events-none opacity-40", "text-foreground hover:bg-muted")}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          {pages.map((p, i) =>
            p === "…" ? (
              <span key={`e${i}`} className="px-1 text-sm text-muted-foreground">
                …
              </span>
            ) : (
              <Link
                key={p}
                href={hrefFor(p)}
                aria-current={p === page ? "page" : undefined}
                className={cn(
                  btn,
                  p === page
                    ? "border-primary bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted",
                )}
              >
                {p}
              </Link>
            ),
          )}
          <Link
            href={hrefFor(page + 1)}
            aria-disabled={page >= totalPages}
            className={cn(btn, page >= totalPages && "pointer-events-none opacity-40", "text-foreground hover:bg-muted")}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </nav>
      ) : null}
    </div>
  );
}
