"use client"

import Link from "next/link"
import { LogOut, Settings } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { GlobalSearch } from "@/components/global-search"
import { MobileDashboardNav } from "@/components/mobile-dashboard-nav"
import { NotificationBell } from "@/components/notification-bell"

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}

export function Header({
  sessionUser,
  showAdminLinks = false,
  isAdmin = false,
}: {
  sessionUser?: { name: string; email: string }
  showAdminLinks?: boolean
  /** Same as sidebar: show admin nav entries (e.g. Admin users). */
  isAdmin?: boolean
}) {
  const router = useRouter()
  const avatar = sessionUser?.name ? initialsFromName(sessionUser.name) : "DM"

  const onLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } finally {
      router.replace("/login")
      router.refresh()
    }
  }

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 shadow-sm sm:gap-4 sm:px-6">
      <MobileDashboardNav isAdmin={isAdmin} />
      <span className="hidden shrink-0 text-sm font-medium text-muted-foreground sm:block">
        Digital Marketing
      </span>
      <div className="min-w-0 flex-1">
        <GlobalSearch showAdminLinks={showAdminLinks} />
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <ThemeToggle />
        <Button
          variant="ghost"
          size="sm"
          className="hidden h-10 px-3 sm:inline-flex"
          onClick={onLogout}
        >
          Logout
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full sm:hidden"
          onClick={onLogout}
          aria-label="Log out"
        >
          <LogOut className="h-4 w-4" />
        </Button>
        <NotificationBell />
        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" asChild>
          <Link href="/dashboard/settings" aria-label="Settings">
            <Settings className="h-4 w-4" />
          </Link>
        </Button>
        <div
          className="ml-1 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground select-none sm:ml-2"
          title={sessionUser ? `${sessionUser.name} (${sessionUser.email})` : undefined}
        >
          {avatar}
        </div>
      </div>
    </header>
  )
}
