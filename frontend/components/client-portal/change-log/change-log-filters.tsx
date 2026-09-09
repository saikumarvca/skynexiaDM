"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRangePicker } from "@/components/client-portal/ui/date-range-picker";
import { CHANGE_LOG_ROLES, PORTAL_ACTOR_ROLE_LABEL } from "@/lib/client-portal/dto";

const ALL = "ALL";

const CATEGORY_OPTIONS = [
  { key: ALL, label: "All Updates" },
  { key: "FEATURE", label: "Feature Updates" },
  { key: "DATA", label: "Data Updates" },
  { key: "REVIEW", label: "Review Actions" },
  { key: "SYSTEM", label: "System Updates" },
];

export function ChangeLogFilters({
  category,
  role,
  search,
  range,
  from,
  to,
}: {
  category: string;
  role: string;
  search: string;
  range: string;
  from?: string;
  to?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(search);
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

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={category || ALL} onValueChange={(v) => setParam("category", v === ALL ? null : v)}>
          <SelectTrigger className="h-10 w-[170px] bg-background" aria-label="Update type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper">
            {CATEGORY_OPTIONS.map((o) => (
              <SelectItem key={o.key} value={o.key}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={role || ALL} onValueChange={(v) => setParam("role", v === ALL ? null : v)}>
          <SelectTrigger className="h-10 w-[150px] bg-background" aria-label="User role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value={ALL}>All Users</SelectItem>
            {CHANGE_LOG_ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {PORTAL_ACTOR_ROLE_LABEL[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DateRangePicker value={range} from={from} to={to} allowAll />
      </div>
      <div className="relative w-full lg:max-w-xs">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search changes..."
          aria-label="Search changes"
          className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>
    </div>
  );
}
