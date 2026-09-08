"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, KeyRound, LogOut, Menu, UserRound, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { initials } from "@/components/client-portal/format";
import { PortalSearch } from "@/components/client-portal/shell/portal-search";
import { PortalNotificationBell } from "@/components/client-portal/shell/portal-notification-bell";
import { PortalSidebarContent } from "@/components/client-portal/shell/portal-sidebar";
import type { SupportContact } from "@/components/client-portal/shell/support-dialog";

export function PortalHeader({
  clientName,
  account,
  unreadNotifications,
  unreadUpdates,
  isPreview,
  support,
}: {
  clientName: string;
  account: { name: string; email: string };
  unreadNotifications: number;
  unreadUpdates: number;
  isPreview: boolean;
  support: SupportContact;
}) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const signOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/client/login");
      router.refresh();
    }
  };

  const exitPreview = async () => {
    try {
      const res = await fetch("/api/client/preview/exit", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { redirectTo?: string };
      router.replace(data.redirectTo || "/dashboard");
      router.refresh();
    } catch {
      router.replace("/dashboard");
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Open navigation"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <SheetContent side="left" className="w-[280px] p-0" showCloseButton={false}>
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <div className="absolute right-2 top-2">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close navigation"
                onClick={() => setDrawerOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <PortalSidebarContent
              clientName={clientName}
              unreadUpdates={unreadUpdates}
              support={support}
              onNavigate={() => setDrawerOpen(false)}
            />
          </SheetContent>
        </Sheet>

        <PortalSearch className="hidden min-w-0 flex-1 sm:block sm:max-w-md" />
        <div className="flex-1 sm:hidden" />

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <PortalNotificationBell initialUnread={unreadNotifications} readOnly={isPreview} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "ml-1 flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-muted",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                )}
                aria-label="Open account menu"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-white">
                  {initials(clientName)}
                </span>
                <span className="hidden min-w-0 text-left md:block">
                  <span className="block max-w-[160px] truncate text-sm font-semibold leading-tight">
                    {clientName}
                  </span>
                  <span className="block max-w-[160px] truncate text-xs text-muted-foreground">
                    {account.email}
                  </span>
                </span>
                <ChevronDown className="hidden h-4 w-4 text-muted-foreground md:block" aria-hidden />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="font-normal">
                <p className="truncate text-sm font-semibold leading-tight">{account.name}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{account.email}</p>
                {isPreview ? (
                  <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400">
                    Preview mode
                  </p>
                ) : null}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/client/profile" className="no-underline">
                  <UserRound />
                  My Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/client/profile#password" className="no-underline">
                  <KeyRound />
                  Change password
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {isPreview ? (
                <DropdownMenuItem onSelect={() => void exitPreview()}>
                  <LogOut />
                  Exit preview
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onSelect={() => void signOut()}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut />
                  Sign out
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="px-4 pb-3 sm:hidden">
        <PortalSearch />
      </div>
    </header>
  );
}
