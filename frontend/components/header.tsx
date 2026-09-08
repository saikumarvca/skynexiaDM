"use client";

import Link from "next/link";
import { LogOut, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { GlobalSearch } from "@/components/global-search";
import { MobileDashboardNav } from "@/components/mobile-dashboard-nav";
import { NotificationBell } from "@/components/notification-bell";
import { cn } from "@/lib/utils";

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export function Header({
  sessionUser,
  showAdminLinks = false,
  isAdmin = false,
  permissions = [],
}: {
  sessionUser?: { name: string; email: string };
  showAdminLinks?: boolean;
  /** Same as sidebar: show admin nav entries (e.g. Admin users). */
  isAdmin?: boolean;
  permissions?: string[];
}) {
  const router = useRouter();
  const avatar = sessionUser?.name ? initialsFromName(sessionUser.name) : "DM";

  const onLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-1.5 border-b bg-background px-2 shadow-sm sm:h-16 sm:gap-4 sm:px-6">
      <MobileDashboardNav isAdmin={isAdmin} permissions={permissions} />
      <span className="hidden shrink-0 text-sm font-medium text-muted-foreground md:block">
        Digital Marketing
      </span>
      <div className="min-w-0 flex-1">
        <GlobalSearch showAdminLinks={showAdminLinks} />
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <ThemeToggle />
        <NotificationBell />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                "ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground select-none transition-colors",
                "hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                "data-[state=open]:bg-primary/90 sm:ml-2",
              )}
              title={
                sessionUser
                  ? `${sessionUser.name} (${sessionUser.email})`
                  : "Account menu"
              }
              aria-label="Open account menu"
            >
              {avatar}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            {sessionUser && (
              <>
                <DropdownMenuLabel className="font-normal">
                  <p className="truncate text-sm font-semibold leading-tight">
                    {sessionUser.name}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {sessionUser.email}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem asChild>
              <Link href="/settings" className="no-underline">
                <Settings />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => void onLogout()}
              className="text-destructive focus:text-destructive"
            >
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
