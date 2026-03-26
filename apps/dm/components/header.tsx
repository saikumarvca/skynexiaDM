"use client"

import Link from "next/link"
import { Bell, Settings } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { GlobalSearch } from "@/components/global-search"

export function Header() {
  const router = useRouter()

  const onLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } finally {
      router.replace("/login")
      router.refresh()
    }
  }

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-background px-6 shadow-sm">
      <span className="text-sm font-medium text-muted-foreground shrink-0 hidden sm:block">Digital Marketing</span>
      <div className="flex-1">
        <GlobalSearch />
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <ThemeToggle />
        <Button variant="ghost" size="sm" className="h-8" onClick={onLogout}>
          Logout
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" asChild>
          <Link href="/dashboard/notifications" aria-label="Notifications">
            <Bell className="h-4 w-4" />
          </Link>
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" asChild>
          <Link href="/dashboard/settings" aria-label="Settings">
            <Settings className="h-4 w-4" />
          </Link>
        </Button>
        <div className="ml-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground select-none">
          DM
        </div>
      </div>
    </header>
  )
}