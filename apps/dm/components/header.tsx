import Link from "next/link"
import { Bell, Home, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6 dark:bg-gray-950">
      <div className="flex items-center space-x-4">
        <h2 className="text-lg font-semibold">Digital Marketing Dashboard</h2>
      </div>
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard" aria-label="Go to dashboard">
            <Home className="h-4 w-4" />
          </Link>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/notifications" aria-label="Notifications">
            <Bell className="h-4 w-4" />
          </Link>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/settings" aria-label="Settings">
            <Settings className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </header>
  )
}