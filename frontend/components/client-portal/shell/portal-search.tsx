"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Megaphone, Search, Star, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ClientSearchHit, ClientSearchResult } from "@/lib/client-portal/search";

const GROUPS: { key: keyof Omit<ClientSearchResult, "query">; label: string; icon: typeof Star }[] = [
  { key: "reviews", label: "Reviews", icon: Star },
  { key: "updates", label: "Updates", icon: Megaphone },
  { key: "activity", label: "Activity", icon: Activity },
];

/** Portal-wide search over the client's own reviews, updates and activity. */
export function PortalSearch({ className }: { className?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ClientSearchResult | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/client/search?q=${encodeURIComponent(q)}`, {
          signal: ctrl.signal,
          cache: "no-store",
        });
        if (res.ok) setResult((await res.json()) as ClientSearchResult);
      } catch {
        /* aborted or offline */
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query]);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const go = (hit: ClientSearchHit) => {
    setOpen(false);
    setQuery("");
    router.push(hit.href);
  };

  // Results only count while they match the current query.
  const activeResult = result && result.query === query.trim() ? result : null;
  const hasResults =
    !!activeResult &&
    activeResult.reviews.length + activeResult.updates.length + activeResult.activity.length > 0;

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <label htmlFor="portal-search" className="sr-only">
        Search
      </label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          id="portal-search"
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
            if (e.key === "Enter" && activeResult) {
              const first =
                activeResult.reviews[0] ?? activeResult.updates[0] ?? activeResult.activity[0];
              if (first) go(first);
            }
          }}
          placeholder="Search reviews, updates, or keywords..."
          autoComplete="off"
          className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-9 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        {loading ? (
          <Loader2
            className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground"
            aria-hidden
          />
        ) : null}
      </div>

      {open && query.trim().length >= 2 ? (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-xl border bg-popover p-2 shadow-lg"
        >
          {!hasResults && !loading ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">
              No matches for “{query.trim()}”.
            </p>
          ) : null}
          {GROUPS.map((g) => {
            const hits = activeResult?.[g.key] ?? [];
            if (hits.length === 0) return null;
            const Icon = g.icon;
            return (
              <div key={g.key} className="mb-1 last:mb-0">
                <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {g.label}
                </p>
                {hits.map((hit) => (
                  <button
                    key={`${hit.type}-${hit.id}`}
                    type="button"
                    role="option"
                    aria-selected={false}
                    onClick={() => go(hit)}
                    className="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left hover:bg-muted"
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{hit.title}</span>
                      {hit.subtitle ? (
                        <span className="block truncate text-xs text-muted-foreground">
                          {hit.subtitle}
                        </span>
                      ) : null}
                    </span>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
