import Link from "next/link"
import { Bell, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

export function Header() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background px-6 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Digital Marketing</span>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
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