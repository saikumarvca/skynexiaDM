"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CLIENT_RANGE_OPTIONS, type ClientRangeKey } from "@/lib/client-portal/date-range";

/**
 * Preset + custom date-range control. Writes `range`, `from`, `to` to the URL
 * so server components re-render with the new window.
 */
export function DateRangePicker({
  value,
  from,
  to,
  allowAll = false,
}: {
  value: string;
  from?: string;
  to?: string;
  /** Adds an "All time" option (used by the change log). */
  allowAll?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [customFrom, setCustomFrom] = useState(from ?? "");
  const [customTo, setCustomTo] = useState(to ?? "");
  const [showCustom, setShowCustom] = useState(value === "custom");

  const apply = (key: string, f?: string, t?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    params.set("range", key);
    if (key === "custom" && f && t) {
      params.set("from", f);
      params.set("to", t);
    } else {
      params.delete("from");
      params.delete("to");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const options = allowAll
    ? [{ key: "all", label: "All time" }, ...CLIENT_RANGE_OPTIONS]
    : CLIENT_RANGE_OPTIONS;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={value}
        onValueChange={(v) => {
          if (v === "custom") {
            setShowCustom(true);
            if (customFrom && customTo) apply("custom", customFrom, customTo);
            return;
          }
          setShowCustom(false);
          apply(v as ClientRangeKey | "all");
        }}
      >
        <SelectTrigger className="h-10 w-[180px] bg-background" aria-label="Date range">
          <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" aria-hidden />
          <SelectValue placeholder="Date range" />
        </SelectTrigger>
        <SelectContent position="popper">
          {options.map((o) => (
            <SelectItem key={o.key} value={o.key}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {showCustom ? (
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (customFrom && customTo) apply("custom", customFrom, customTo);
          }}
        >
          <input
            type="date"
            aria-label="From date"
            value={customFrom}
            max={customTo || undefined}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-2 text-sm"
            required
          />
          <span className="text-sm text-muted-foreground">to</span>
          <input
            type="date"
            aria-label="To date"
            value={customTo}
            min={customFrom || undefined}
            onChange={(e) => setCustomTo(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-2 text-sm"
            required
          />
          <Button type="submit" size="sm" className="h-10">
            Apply
          </Button>
        </form>
      ) : null}
    </div>
  );
}
