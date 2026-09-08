"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { PORTAL_MOBILE_NAV, isPortalPathActive } from "@/components/client-portal/shell/portal-nav";

/** Bottom navigation for phones and small tablets. */
export function PortalMobileNav({ unreadUpdates = 0 }: { unreadUpdates?: number }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Client portal (mobile)"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85 lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-5">
        {PORTAL_MOBILE_NAV.map((item) => {
          const active = isPortalPathActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium no-underline",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
                <span>{item.shortName}</span>
                {item.key === "updates" && unreadUpdates > 0 ? (
                  <span
                    className="absolute right-[calc(50%-16px)] top-2 h-2 w-2 rounded-full bg-emerald-500"
                    aria-hidden
                  />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
