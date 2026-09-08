"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/components/client-portal/format";
import type { ClientNotificationItem, Paginated } from "@/lib/client-portal/dto";

const POLL_INTERVAL_MS = 60_000;
const PREVIEW_LIMIT = 8;

export function PortalNotificationBell({
  initialUnread = 0,
  readOnly = false,
}: {
  initialUnread?: number;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [unread, setUnread] = useState(initialUnread);
  const [items, setItems] = useState<ClientNotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchUnread = useCallback(async () => {
    try {
      const res = await fetch("/api/client/notifications/unread-count", { cache: "no-store" });
      if (res.ok) setUnread(((await res.json()) as { count: number }).count);
    } catch {
      /* ignore */
    }
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/client/notifications?pageSize=${PREVIEW_LIMIT}`, {
        cache: "no-store",
      });
      if (res.ok) setItems(((await res.json()) as Paginated<ClientNotificationItem>).items);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    timer.current = setInterval(() => void fetchUnread(), POLL_INTERVAL_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [fetchUnread]);

  useEffect(() => {
    if (open) void fetchItems();
  }, [open, fetchItems]);

  const markRead = async (n: ClientNotificationItem) => {
    if (!n.isRead && !readOnly) {
      try {
        await fetch(`/api/client/notifications/${n.id}/read`, { method: "POST" });
        setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
        setUnread((c) => Math.max(0, c - 1));
      } catch {
        /* ignore */
      }
    }
    if (n.href) {
      setOpen(false);
      router.push(n.href);
    }
  };

  const markAll = async () => {
    if (readOnly) return;
    try {
      await fetch("/api/client/notifications/read-all", { method: "POST" });
      setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
      setUnread(0);
    } catch {
      /* ignore */
    }
  };

  const badge = unread > 99 ? "99+" : unread > 0 ? String(unread) : null;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-full"
          aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
        >
          <Bell className="h-[18px] w-[18px]" />
          {badge ? (
            <span
              className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-background"
              aria-hidden
            >
              {badge}
            </span>
          ) : null}
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-50 w-[min(22rem,calc(100vw-1.5rem))] rounded-xl border bg-popover shadow-lg outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        >
          <div className="flex items-center justify-between border-b px-4 py-3">
            <span className="text-sm font-semibold">Notifications</span>
            {unread > 0 && !readOnly ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                onClick={markAll}
              >
                <CheckCheck className="h-3.5 w-3.5" aria-hidden />
                Mark all read
              </Button>
            ) : null}
          </div>
          <div className="max-h-[60vh] overflow-y-auto scrollbar-thin">
            {loading && items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">Loading…</p>
            ) : items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                You&apos;re all caught up.
              </p>
            ) : (
              <ul className="divide-y">
                {items.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => void markRead(n)}
                      className={cn(
                        "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60",
                        !n.isRead && "bg-primary/[0.04]",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                          n.isRead ? "bg-transparent" : "bg-primary",
                        )}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{n.title}</span>
                        <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">
                          {n.message}
                        </span>
                        <span className="mt-1 block text-[11px] text-muted-foreground">
                          {timeAgo(n.createdAt)}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="border-t px-4 py-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                setOpen(false);
                router.push("/client/notifications");
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
