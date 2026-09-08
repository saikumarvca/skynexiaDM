"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { PORTAL_NAV, isPortalPathActive } from "@/components/client-portal/shell/portal-nav";

export function PortalNavLinks({
  unreadUpdates = 0,
  onNavigate,
}: {
  unreadUpdates?: number;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <nav aria-label="Client portal" className="flex flex-col gap-1">
      {PORTAL_NAV.map((item) => {
        const active = isPortalPathActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.key}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium no-underline transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
              active
                ? "bg-primary/10 text-primary"
                : "text-foreground/80 hover:bg-muted hover:text-foreground",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-primary transition-opacity",
                active ? "opacity-100" : "opacity-0",
              )}
            />
            <Icon
              className={cn(
                "h-[18px] w-[18px] shrink-0",
                active ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
              )}
              aria-hidden
            />
            <span className="min-w-0 flex-1 truncate">{item.name}</span>
            {item.key === "updates" && unreadUpdates > 0 ? (
              <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                New
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
