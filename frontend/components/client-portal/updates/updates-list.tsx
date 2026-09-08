"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ExternalLink, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/components/client-portal/format";
import { EmptyState, RoleBadge } from "@/components/client-portal/ui/primitives";
import { PORTAL_UPDATE_CATEGORY_LABEL, type ClientUpdateItem } from "@/lib/client-portal/dto";

const CATEGORY_PILL: Record<ClientUpdateItem["category"], string> = {
  ANNOUNCEMENT: "bg-primary/10 text-primary",
  PROGRESS: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  FEATURE: "bg-violet-500/12 text-violet-700 dark:text-violet-300",
  MAINTENANCE: "bg-amber-500/14 text-amber-800 dark:text-amber-300",
  REPORTING: "bg-sky-500/12 text-sky-700 dark:text-sky-300",
};

export function UpdatesList({
  items,
  openId,
  readOnly,
}: {
  items: ClientUpdateItem[];
  openId?: string;
  readOnly: boolean;
}) {
  const router = useRouter();
  const [list, setList] = useState(items);
  const [expanded, setExpanded] = useState<string | null>(openId ?? null);
  const [syncedItems, setSyncedItems] = useState(items);
  if (items !== syncedItems) {
    setSyncedItems(items);
    setList(items);
  }

  const markRead = async (u: ClientUpdateItem) => {
    if (u.isRead || readOnly) return;
    try {
      await fetch(`/api/client/updates/${u.id}/read`, { method: "POST" });
      setList((prev) => prev.map((x) => (x.id === u.id ? { ...x, isRead: true } : x)));
      router.refresh();
    } catch {
      /* ignore */
    }
  };

  // Deep link (?open=<id>): mark that update as read once it is shown.
  useEffect(() => {
    if (!openId || readOnly) return;
    const target = items.find((u) => u.id === openId);
    if (!target || target.isRead) return;
    fetch(`/api/client/updates/${target.id}/read`, { method: "POST" })
      .then(() => {
        setList((prev) => prev.map((x) => (x.id === target.id ? { ...x, isRead: true } : x)));
        router.refresh();
      })
      .catch(() => {
        /* ignore */
      });
  }, [openId, items, readOnly, router]);

  if (list.length === 0) {
    return (
      <EmptyState
        icon={Megaphone}
        title="No updates yet"
        description="Announcements from your agency team will be posted here."
      />
    );
  }

  return (
    <ul className="space-y-3">
      {list.map((u) => {
        const open = expanded === u.id;
        return (
          <li
            key={u.id}
            id={`update-${u.id}`}
            className={cn(
              "rounded-xl border bg-card transition-colors",
              !u.isRead && "border-primary/40 bg-primary/[0.03]",
            )}
          >
            <button
              type="button"
              className="flex w-full items-start gap-3 p-4 text-left"
              aria-expanded={open}
              onClick={() => {
                setExpanded(open ? null : u.id);
                void markRead(u);
              }}
            >
              <span
                className={cn(
                  "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                  u.isRead ? "bg-transparent ring-1 ring-border" : "bg-primary",
                )}
                aria-label={u.isRead ? "Read" : "Unread"}
              />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className={cn("text-[15px] font-semibold", !u.isRead && "text-foreground")}>
                    {u.title}
                  </span>
                  <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-semibold", CATEGORY_PILL[u.category])}>
                    {PORTAL_UPDATE_CATEGORY_LABEL[u.category]}
                  </span>
                </span>
                <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{u.postedByName}</span>
                  <RoleBadge role={u.postedByRole} />
                  <span aria-hidden>·</span>
                  <span className="tabular-nums">{formatDateTime(u.publishedAt)}</span>
                </span>
                {!open ? (
                  <span className="mt-1.5 line-clamp-2 block text-sm text-muted-foreground">{u.body}</span>
                ) : null}
              </span>
              <ChevronDown
                className={cn("mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
                aria-hidden
              />
            </button>
            {open ? (
              <div className="border-t px-4 pb-4 pt-3">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{u.body}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {u.relatedReviewId ? (
                    <Link
                      href={`/client/reviews/${u.relatedReviewId}`}
                      className="inline-flex h-8 items-center rounded-md border border-primary/40 px-3 text-xs font-semibold text-primary no-underline hover:bg-primary/10"
                    >
                      {u.relatedLabel ? `View: ${u.relatedLabel}` : "View related review"}
                    </Link>
                  ) : u.relatedLabel ? (
                    <span className="text-xs text-muted-foreground">Related: {u.relatedLabel}</span>
                  ) : null}
                  {u.linkUrl ? (
                    <a
                      href={u.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs font-semibold no-underline hover:bg-muted"
                    >
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                      {u.linkLabel || "Open link"}
                    </a>
                  ) : null}
                </div>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
