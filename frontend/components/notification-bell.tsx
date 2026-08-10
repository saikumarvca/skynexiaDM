"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import * as Popover from "@radix-ui/react-popover";
import { Button } from "@/components/ui/button";

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  href?: string;
  isRead: boolean;
  createdAt: string;
}

const POLL_INTERVAL_MS = 60_000;
const PREVIEW_LIMIT = 10;

export function NotificationBell() {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/unread-count", {
        cache: "no-store",
      });
      if (res.ok) {
        const data = (await res.json()) as { count: number };
        setUnreadCount(data.count);
      }
    } catch {
      // silently ignore network errors for polling
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/notifications?limit=${PREVIEW_LIMIT}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = (await res.json()) as Notification[];
        setNotifications(data.slice(0, PREVIEW_LIMIT));
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + polling for unread count
  useEffect(() => {
    void fetchUnreadCount();
    intervalRef.current = setInterval(() => {
      void fetchUnreadCount();
    }, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchUnreadCount]);

  // Fetch notifications when popover opens
  useEffect(() => {
    if (open) {
      void fetchNotifications();
    }
  }, [open, fetchNotifications]);

  const handleMarkRead = async (notification: Notification) => {
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
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        // ignore
      }
    }
    if (notification.href) {
      setOpen(false);
      router.push(notification.href);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  const displayCount =
    unreadCount > 99 ? "99+" : unreadCount > 0 ? String(unreadCount) : null;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-full"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        >
          <Bell className="h-4 w-4" />
          {displayCount && (
            <span
              className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-bold leading-none text-white"
              aria-hidden
            >
              {displayCount}
            </span>
          )}
        </Button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-50 w-[min(20rem,calc(100vw-2rem))] max-w-[calc(100vw-1rem)] rounded-xl border bg-popover shadow-lg outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <span className="text-sm font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                onClick={handleMarkAllRead}
              >
                Mark all as read
              </Button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-[380px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                Loading…
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <Bell className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  No notifications
                </p>
              </div>
            ) : (
              <ul className="divide-y">
                {notifications.map((n) => (
                  <li key={n._id}>
                    <button
                      type="button"
                      onClick={() => void handleMarkRead(n)}
                      className={`w-full px-4 py-3 text-left transition-colors hover:bg-accent ${
                        n.isRead ? "opacity-60" : ""
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {!n.isRead && (
                          <span
                            className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500"
                            aria-hidden
                          />
                        )}
                        {n.isRead && (
                          <span
                            className="mt-1.5 h-2 w-2 shrink-0"
                            aria-hidden
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium leading-tight">
                            {n.title}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                            {n.message}
                          </p>
                          <p className="mt-1 text-[11px] text-muted-foreground/70">
                            {formatDistanceToNow(new Date(n.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="border-t px-4 py-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                setOpen(false);
                router.push("/dashboard/notifications");
              }}
            >
              View all notifications
            </Button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
