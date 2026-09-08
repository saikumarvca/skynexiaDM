"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BarChart3, KeyRound, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export function ClientPortalHeader({
  user,
  clientName,
}: {
  user: { name: string; email: string };
  clientName: string;
}) {
  const router = useRouter();

  const onLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href="/client-portal"
          className="flex min-w-0 items-center gap-2 text-foreground no-underline"
          aria-label="Client portal home"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary">
            <BarChart3 className="h-4 w-4 text-primary-foreground" aria-hidden />
          </span>
          <span className="truncate text-sm font-semibold tracking-tight">
            DM Dashboard
          </span>
          <span className="hidden text-muted-foreground sm:inline" aria-hidden>
            /
          </span>
          <span className="hidden truncate text-sm text-muted-foreground sm:inline">
            {clientName}
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "ml-1 flex h-10 w-10 shrink-0 select-none items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground transition-colors",
                  "hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  "data-[state=open]:bg-primary/90",
                )}
                title={`${user.name} (${user.email})`}
                aria-label="Open account menu"
              >
                {initialsFromName(user.name)}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel className="font-normal">
                <p className="truncate text-sm font-semibold leading-tight">
                  {user.name}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {user.email}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/client-portal/password" className="no-underline">
                  <KeyRound />
                  Change password
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
      </div>
    </header>
  );
}
