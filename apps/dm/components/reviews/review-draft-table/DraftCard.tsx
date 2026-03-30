"use client";

import React from "react";
import { Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ReviewDraft } from "@/types/reviews";
import { truncate } from "./utils";

export function DraftCard(props: {
  draft: ReviewDraft;
  mode: "row" | "grid";
  selected: boolean;
  assignedToName?: string;
  canArchive: boolean;
  clientName: string;
  onArchiveClick: () => void;
  onOpen: () => void;
  onRef: (el: HTMLDivElement | null) => void;
}) {
  const {
    draft: d,
    mode,
    selected,
    assignedToName,
    canArchive,
    clientName,
    onArchiveClick,
    onOpen,
    onRef,
  } = props;

  return (
    <div
      key={d._id}
      ref={onRef}
      className={cn(
        "group relative rounded-lg border bg-card text-card-foreground shadow-md/40 transition-all hover:shadow-lg/35",
        selected && "border-primary/50 ring-2 ring-ring",
      )}
    >
      {canArchive && (
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="absolute right-2 top-2 z-10 h-8 w-8 shrink-0 shadow-sm"
          aria-label={`Archive draft: ${d.subject}`}
          title="Archive"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onArchiveClick();
          }}
        >
          <Archive className="h-4 w-4" />
        </Button>
      )}
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen();
          }
        }}
        className={cn(
          "w-full cursor-pointer text-left rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
          mode === "grid"
            ? cn("p-4 flex flex-col hover:-translate-y-0.5", canArchive && "pt-12")
            : cn(
                "flex flex-col gap-3 md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_minmax(0,2fr)] md:items-start",
                canArchive ? "p-4 pt-12 md:p-5 md:pt-12" : "p-4 md:p-5",
              ),
        )}
        aria-label={`Open details for ${d.subject}`}
      >
        <div className="min-w-0">
          <div
            className={cn(
              "flex items-start justify-between gap-3",
              canArchive && "pr-10",
            )}
          >
            <div className="min-w-0">
              <p
                className="font-semibold leading-snug truncate group-hover:text-foreground"
                title={d.subject}
              >
                {d.subject}
              </p>
              <p
                className="mt-1 text-xs text-muted-foreground truncate"
                title={clientName}
              >
                {clientName}
              </p>
            </div>
            <span className="shrink-0 inline-flex rounded-full border bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {d.language || "—"}
            </span>
          </div>

          {mode === "grid" && (
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
              {d.category ? (
                <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                  {d.category}
                </span>
              ) : (
                <span className="text-muted-foreground">No category</span>
              )}
              <span className="ml-auto inline-flex rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
                {d.status}
              </span>
            </div>
          )}
        </div>

        <p
          className={cn(
            "text-sm text-muted-foreground",
            mode === "grid" ? "mt-3" : "md:mt-0",
          )}
          title={d.reviewText}
        >
          {truncate(d.reviewText, mode === "grid" ? 110 : 220)}
        </p>

        {mode === "row" && (
          <div className="flex flex-wrap items-center gap-2 text-xs md:justify-end md:self-center">
            {d.category ? (
              <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                {d.category}
              </span>
            ) : (
              <span className="text-muted-foreground">No category</span>
            )}
            <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
              {d.status}
            </span>
            <span className="text-muted-foreground">Assigned to</span>
            {assignedToName ? (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary ring-1 ring-primary/20">
                {assignedToName}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground ring-1 ring-border">
                Unassigned
              </span>
            )}
          </div>
        )}

        {mode === "grid" && (
          <div className="mt-4 pt-3 border-t flex items-center gap-2 text-xs text-muted-foreground">
            <span>Assigned to</span>
            {assignedToName ? (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary ring-1 ring-primary/20">
                {assignedToName}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground ring-1 ring-border">
                Unassigned
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

