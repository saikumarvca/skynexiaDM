"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export interface NotificationItem {
  _id: string;
  type: string;
  title: string;
  message: string;
  href?: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsPageClientProps {
  initialNotifications: NotificationItem[];
}

const TYPE_LABELS: Record<string, string> = {
  TASK_ASSIGNED: "Task",
  REVIEW_ASSIGNED: "Review",
  CAMPAIGN_UPDATED: "Campaign",
  LEAD_UPDATED: "Lead",
  SYSTEM: "System",
};

const TYPE_COLORS: Record<string, string> = {
  TASK_ASSIGNED:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  REVIEW_ASSIGNED:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  CAMPAIGN_UPDATED:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  LEAD_UPDATED:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  SYSTEM: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

export function NotificationsPageClient({
  initialNotifications,
}: NotificationsPageClientProps) {
  const router = useRouter();
  const [notifications, setNotifications] =
    useState<NotificationItem[]>(initialNotifications);
  const [markingAll, setMarkingAll] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkRead = useCallback(
    async (notification: NotificationItem) => {
      if (!notification.isRead) {
        try {
          await fetch(`/api/notifications/${notification._id}/read`, {
            method: "POST",
          });
          setNotifications((prev) =>
            prev.map((n) =>
              n._id === notification._id ? { ...n, isRead: true } : n,
            ),
          );
        } catch {
          // ignore
        }
      }
      if (notification.href) {
        router.push(notification.href);
      }
    },
    [router],
  );

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // ignore
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Actions bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {unreadCount > 0
            ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
            : "All caught up!"}
        </p>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="gap-2"
          >
            <CheckCheck className="h-4 w-4" />
            {markingAll ? "Marking…" : "Mark all as read"}
          </Button>
        )}
      </div>

      {/* Notification cards */}
      {notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Bell className="h-10 w-10 text-muted-foreground/30" />
            <div>
              <p className="font-medium">No notifications yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Activity across tasks, reviews, campaigns, and leads will appear
                here.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card
              key={n._id}
              className={`transition-colors ${
                n.isRead
                  ? "opacity-70"
                  : "border-blue-200 dark:border-blue-800/60"
              }`}
            >
              <CardContent className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => void handleMarkRead(n)}
                  className={`w-full text-left ${n.href ? "cursor-pointer" : "cursor-default"}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Unread indicator */}
                    <div className="mt-1.5 shrink-0">
                      {!n.isRead ? (
                        <span
                          className="block h-2.5 w-2.5 rounded-full bg-blue-500"
                          aria-label="Unread"
                        />
                      ) : (
                        <span
                          className="block h-2.5 w-2.5 rounded-full bg-transparent"
                          aria-hidden
                        />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p
                          className={`text-sm font-semibold ${!n.isRead ? "" : "font-medium"}`}
                        >
                          {n.title}
                        </p>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            TYPE_COLORS[n.type] ?? TYPE_COLORS["SYSTEM"]!
                          }`}
                        >
                          {TYPE_LABELS[n.type] ?? n.type}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {n.message}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground/60">
                        {formatDistanceToNow(new Date(n.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>

                    {n.href && (
                      <span className="shrink-0 text-xs text-primary underline-offset-2 hover:underline">
                        View
                      </span>
                    )}
                  </div>
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
