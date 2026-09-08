"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRangePicker } from "@/components/client-portal/ui/date-range-picker";
import {
  CLIENT_REVIEW_STATUSES,
  CLIENT_REVIEW_STATUS_LABEL,
  type ClientReviewStatus,
} from "@/lib/client-portal/dto";

const ALL = "ALL";

export function ReviewStatusTabs({
  active,
  counts,
}: {
  active: ClientReviewStatus | null;
  counts: Record<ClientReviewStatus | "ALL", number>;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const hrefFor = (status: ClientReviewStatus | null) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (status) params.set("status", status);
    else params.delete("status");
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };
  const tabs: { key: ClientReviewStatus | null; label: string; count: number }[] = [
    { key: null, label: "All", count: counts.ALL },
    ...CLIENT_REVIEW_STATUSES.map((s) => ({
      key: s,
      label: CLIENT_REVIEW_STATUS_LABEL[s],
      count: counts[s],
    })),
  ];
  return (
    <div className="-mb-px flex gap-1 overflow-x-auto border-b scrollbar-thin">
      {tabs.map((t) => {
        const isActive = t.key === active;
        return (
          <Link
            key={t.key ?? "all"}
            href={hrefFor(t.key)}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium no-underline transition-colors",
              isActive
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[11px] tabular-nums",
                isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
              )}
            >
              {t.count}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

export function ReviewFilters({
  platforms,
  platform,
  search,
  range,
  from,
  to,
}: {
  platforms: string[];
  platform: string;
  search: string;
  range: string;
  from?: string;
  to?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(search);
  const [showFilters, setShowFilters] = useState(!!platform || range !== "all");
  // Keep the input in sync when the URL changes from elsewhere (e.g. Clear).
  const [syncedSearch, setSyncedSearch] = useState(search);
  if (search !== syncedSearch) {
    setSyncedSearch(search);
    setQ(search);
  }

  const setParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  };

  useEffect(() => {
    if (q === search) return;
    const t = setTimeout(() => setParam("search", q.trim() || null), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const hasFilters = !!platform || !!search || range !== "all";

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search reviews..."
            aria-label="Search reviews"
            className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-10 gap-2"
          onClick={() => setShowFilters((v) => !v)}
          aria-expanded={showFilters}
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden />
          Filter
        </Button>
        {hasFilters ? (
          <Button
            type="button"
            variant="ghost"
            className="h-10 gap-1 text-muted-foreground"
            onClick={() => router.push(pathname)}
          >
            <X className="h-4 w-4" aria-hidden />
            Clear
          </Button>
        ) : null}
      </div>
      {showFilters ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 p-3">
          <Select
            value={platform || ALL}
            onValueChange={(v) => setParam("platform", v === ALL ? null : v)}
          >
            <SelectTrigger className="h-10 w-[170px] bg-background" aria-label="Platform">
              <SelectValue placeholder="All platforms" />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value={ALL}>All platforms</SelectItem>
              {platforms.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DateRangePicker value={range} from={from} to={to} allowAll />
        </div>
      ) : null}
    </div>
  );
}
