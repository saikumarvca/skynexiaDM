"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/components/client-portal/format";
import { EmptyState } from "@/components/client-portal/ui/primitives";
import type { ClientNotificationItem } from "@/lib/client-portal/dto";

const TYPE_LABEL: Record<string, string> = {
  REVIEW_SHARED: "Shared",
  REVIEW_POSTED: "Posted",
  REVIEW_PROGRESS: "Progress",
  REVIEW_MILESTONE: "Milestone",
  CLIENT_UPDATE: "Update",
  SYSTEM: "System",
};

const TYPE_PILL: Record<string, string> = {
  REVIEW_SHARED: "bg-violet-500/12 text-violet-700 dark:text-violet-300",
  REVIEW_POSTED: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  REVIEW_PROGRESS: "bg-amber-500/14 text-amber-800 dark:text-amber-300",
  REVIEW_MILESTONE: "bg-amber-500/14 text-amber-800 dark:text-amber-300",
  CLIENT_UPDATE: "bg-primary/10 text-primary",
  SYSTEM: "bg-slate-500/12 text-slate-700 dark:text-slate-300",
};

export function NotificationsList({
  items,
  readOnly,
}: {
  items: ClientNotificationItem[];
  readOnly: boolean;
}) {
  const router = useRouter();
  const [list, setList] = useState(items);
  const [syncedItems, setSyncedItems] = useState(items);
  if (items !== syncedItems) {
    setSyncedItems(items);
    setList(items);
  }
  const unread = list.filter((n) => !n.isRead).length;

  const markRead = async (n: ClientNotificationItem) => {
    if (n.isRead || readOnly) return;
    try {
      await fetch(`/api/client/notifications/${n.id}/read`, { method: "POST" });
      setList((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
      router.refresh();
    } catch {
      /* ignore */
    }
  };

  const markAll = async () => {
    if (readOnly) return;
    try {
      await fetch("/api/client/notifications/read-all", { method: "POST" });
      setList((prev) => prev.map((x) => ({ ...x, isRead: true })));
      router.refresh();
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {unread > 0 ? `${unread} unread` : "All caught up"}
        </p>
        {unread > 0 && !readOnly ? (
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => void markAll()}>
            <CheckCheck className="h-4 w-4" aria-hidden />
            Mark all as read
          </Button>
        ) : null}
      </div>
      {list.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="You'll be notified when reviews are shared or posted and when your agency posts an update."
        />
      ) : (
        <ul className="divide-y rounded-lg border">
          {list.map((n) => {
            const inner = (
              <>
                <span
                  className={cn("mt-2 h-2 w-2 shrink-0 rounded-full", n.isRead ? "bg-transparent ring-1 ring-border" : "bg-primary")}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className={cn("text-sm", n.isRead ? "font-medium" : "font-semibold")}>{n.title}</span>
                    <span className={cn("rounded-md px-1.5 py-0.5 text-[11px] font-semibold", TYPE_PILL[n.type] ?? TYPE_PILL.SYSTEM)}>
                      {TYPE_LABEL[n.type] ?? "Notice"}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">{n.message}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{timeAgo(n.createdAt)}</span>
                </span>
              </>
            );
            const cls = cn(
              "flex w-full gap-3 p-4 text-left transition-colors hover:bg-muted/50",
              !n.isRead && "bg-primary/[0.03]",
            );
            return (
              <li key={n.id}>
                {n.href ? (
                  <Link href={n.href} className={cn(cls, "text-foreground no-underline")} onClick={() => void markRead(n)}>
                    {inner}
                  </Link>
                ) : (
                  <button type="button" className={cls} onClick={() => void markRead(n)}>
                    {inner}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
