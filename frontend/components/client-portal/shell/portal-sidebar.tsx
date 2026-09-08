"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { initials } from "@/components/client-portal/format";
import { PortalNavLinks } from "@/components/client-portal/shell/portal-nav-links";
import { SupportCard, type SupportContact } from "@/components/client-portal/shell/support-dialog";

export function PortalBrand({ className }: { className?: string }) {
  return (
    <Link
      href="/client/dashboard"
      className={cn("block text-foreground no-underline", className)}
      aria-label="Skynexia DM client portal home"
    >
      <span className="block text-[22px] font-extrabold leading-none tracking-tight">
        Skynexia DM
      </span>
      <span className="mt-1 block text-sm text-muted-foreground">Client Portal</span>
    </Link>
  );
}

export function ClientIdentity({
  name,
  subtitle = "Client Account",
  size = "md",
}: {
  name: string;
  subtitle?: string;
  size?: "sm" | "md";
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full bg-[#101a3d] font-bold text-white ring-2 ring-primary/30",
          size === "md" ? "h-12 w-12 text-base" : "h-9 w-9 text-sm",
        )}
        aria-hidden
      >
        {initials(name)}
      </span>
      <div className="min-w-0">
        <p className="truncate text-[15px] font-semibold leading-tight">{name}</p>
        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

export function PortalSidebarContent({
  clientName,
  unreadUpdates,
  support,
  onNavigate,
}: {
  clientName: string;
  unreadUpdates: number;
  support: SupportContact;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-4 pt-6">
        <PortalBrand />
      </div>
      <div className="px-5 pb-5">
        <ClientIdentity name={clientName} />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 scrollbar-thin">
        <PortalNavLinks unreadUpdates={unreadUpdates} onNavigate={onNavigate} />
      </div>
      <div className="p-4">
        <SupportCard contact={support} />
      </div>
    </div>
  );
}

/** Desktop sidebar (hidden on small screens; the drawer covers those). */
export function PortalSidebar(props: {
  clientName: string;
  unreadUpdates: number;
  support: SupportContact;
}) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-[240px] shrink-0 border-r border-border/80 bg-card lg:block">
      <PortalSidebarContent {...props} />
    </aside>
  );
}
