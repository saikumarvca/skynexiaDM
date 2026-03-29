import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Bell } from "lucide-react"
import { serverFetch } from "@/lib/server-fetch"
import {
  NotificationsPageClient,
  type NotificationItem,
} from "@/components/notifications-page-client"

export const dynamic = "force-dynamic"

async function getNotifications(): Promise<NotificationItem[]> {
  try {
    const res = await serverFetch("/api/notifications")
    if (!res.ok) return []
    return (await res.json()) as NotificationItem[]
  } catch (e) {
    console.error("Error fetching notifications:", e)
    return []
  }
}

export default async function DashboardNotificationsPage() {
  const notifications = await getNotifications()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
              <Bell className="h-7 w-7" />
              Notifications
            </h1>
            <p className="mt-1 text-muted-foreground">
              Stay up to date with activity across tasks, reviews, campaigns, and leads.
            </p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline">Back to dashboard</Button>
          </Link>
        </div>

        <NotificationsPageClient initialNotifications={notifications} />
      </div>
    </DashboardLayout>
  )
}
