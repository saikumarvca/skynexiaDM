"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { MarkSharedModal } from "./mark-shared-modal";
import { MarkPostedModal } from "./mark-posted-modal";
import { ReviewActivityTimeline } from "./review-activity-timeline";
import { ReviewDetailSidePane } from "./review-detail-side-pane";
import type { ReviewAllocation } from "@/types/reviews";

function truncate(s: string, len: number) {
  if (!s) return "—";
  return s.length <= len ? s : s.slice(0, len) + "…";
}

function getDraftInfo(a: ReviewAllocation) {
  const d = a.draftId;
  if (typeof d === "object" && d) {
    return {
      subject: (d as { subject?: string }).subject ?? "—",
      preview: (d as { reviewText?: string }).reviewText ?? "—",
      clientName: (d as { clientName?: string }).clientName ?? "—",
    };
  }
  return { subject: "—", preview: "—", clientName: "—" };
}

interface ReviewAllocationTableProps {
  allocations: ReviewAllocation[];
  onMarkShared: (
    id: string,
    data: {
      customerName: string;
      customerContact?: string;
      platform?: string;
      sentDate: string;
    },
  ) => Promise<void>;
  onMarkPosted: (
    id: string,
    data: {
      postedByName: string;
      platform: string;
      reviewLink: string;
      proofUrl?: string;
      postedDate: string;
      markedUsedBy: string;
      remarks?: string;
    },
  ) => Promise<void>;
  onCancel?: (id: string) => Promise<void>;
  showMyAssignedOnly?: boolean;
  viewMode?: "table" | "cards" | "responsive";
}

export function ReviewAllocationTable({
  allocations,
  onMarkShared,
  onMarkPosted,
  onCancel,
  showMyAssignedOnly = false,
  viewMode = "table",
}: ReviewAllocationTableProps) {
  const effectiveViewMode =
    viewMode === "table" && showMyAssignedOnly ? "responsive" : viewMode;
  const router = useRouter();
  const [sharedAlloc, setSharedAlloc] = useState<ReviewAllocation | null>(null);
  const [postedAlloc, setPostedAlloc] = useState<ReviewAllocation | null>(null);
  const [activityAlloc, setActivityAlloc] = useState<ReviewAllocation | null>(
    null,
  );
  const [detailAlloc, setDetailAlloc] = useState<ReviewAllocation | null>(null);
  const [activity, setActivity] = useState<
    { action: string; performedBy: string; performedAt: string }[]
  >([]);

  const fetchActivity = async (entityType: string, entityId: string) => {
    const res = await fetch(
      `/api/review-activity?entityType=${entityType}&entityId=${entityId}`,
    );
    if (!res.ok) return [];
    return res.json();
  };

  const openActivity = async (a: ReviewAllocation) => {
    setActivityAlloc(a);
    const logs = await fetchActivity("ALLOCATION", a._id);
    setActivity(logs);
  };

  return (
    <>
      {effectiveViewMode === "table" || effectiveViewMode === "responsive" ? (
        <div
          className={`max-w-full overflow-x-auto rounded-lg border bg-card shadow-sm ${
            effectiveViewMode === "responsive" ? "hidden md:block" : ""
          }`}
        >
          <Table className="min-w-[920px]">
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="font-semibold text-foreground">
                  Subject
                </TableHead>
                <TableHead className="font-semibold text-foreground">
                  Draft Preview
                </TableHead>
                <TableHead className="font-semibold text-foreground">
                  Client
                </TableHead>
                <TableHead className="font-semibold text-foreground">
                  Assigned To
                </TableHead>
                <TableHead className="font-semibold text-foreground">
                  Customer
                </TableHead>
                <TableHead className="font-semibold text-foreground">
                  Platform
                </TableHead>
                <TableHead className="font-semibold text-foreground">
                  Status
                </TableHead>
                <TableHead className="font-semibold text-foreground">
                  Sent
                </TableHead>
                <TableHead className="font-semibold text-foreground">
                  Posted
                </TableHead>
                <TableHead className="font-semibold text-foreground">
                  Used
                </TableHead>
                <TableHead className="text-right font-semibold text-foreground">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allocations.map((a) => {
                const { subject, preview, clientName } = getDraftInfo(a);
                const isUsed =
                  a.allocationStatus === "Used" ||
                  a.allocationStatus === "Posted";
                return (
                  <TableRow
                    key={a._id}
                    className="cursor-pointer hover:bg-muted/60 transition-colors"
                    onClick={() => setDetailAlloc(a)}
                  >
                    <TableCell className="font-medium text-primary">
                      {subject}
                    </TableCell>
                    <TableCell
                      className="max-w-[180px] truncate text-sm text-muted-foreground"
                      title={preview}
                    >
                      {truncate(preview, 50)}
                    </TableCell>
                    <TableCell className="text-sm">{clientName}</TableCell>
                    <TableCell className="text-sm">
                      {a.assignedToUserName}
                    </TableCell>
                    <TableCell className="text-sm">
                      {a.customerName ?? (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {a.platform ?? (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={a.allocationStatus} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {a.sentDate
                        ? new Date(a.sentDate).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {a.postedDate
                        ? new Date(a.postedDate).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {isUsed ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Used
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell
                      className="text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-end gap-1.5">
                        {a.allocationStatus === "Assigned" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setSharedAlloc(a)}
                          >
                            Mark Shared
                          </Button>
                        )}
                        {(a.allocationStatus === "Assigned" ||
                          a.allocationStatus === "Shared with Customer") && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setPostedAlloc(a)}
                          >
                            Mark Posted
                          </Button>
                        )}
                        {onCancel &&
                          a.allocationStatus !== "Used" &&
                          a.allocationStatus !== "Posted" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-destructive hover:text-destructive"
                              onClick={() => onCancel(a._id)}
                            >
                              Cancel
                            </Button>
                          )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => openActivity(a)}
                        >
                          History
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : null}

      {effectiveViewMode === "cards" || effectiveViewMode === "responsive" ? (
        <div
          className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-3 ${
            effectiveViewMode === "responsive" ? "md:hidden" : ""
          }`}
        >
          {allocations.map((a) => {
            const { subject, preview, clientName } = getDraftInfo(a);
            const isUsed =
              a.allocationStatus === "Used" || a.allocationStatus === "Posted";
            return (
              <Card
                key={a._id}
                className="cursor-pointer hover:border-primary/40"
                onClick={() => setDetailAlloc(a)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{subject}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-muted-foreground" title={preview}>
                    {truncate(preview, 120)}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <p><span className="text-muted-foreground">Client:</span> {clientName}</p>
                    <p><span className="text-muted-foreground">Assigned:</span> {a.assignedToUserName}</p>
                    <p><span className="text-muted-foreground">Customer:</span> {a.customerName ?? "—"}</p>
                    <p><span className="text-muted-foreground">Platform:</span> {a.platform ?? "—"}</p>
                    <p><span className="text-muted-foreground">Sent:</span> {a.sentDate ? new Date(a.sentDate).toLocaleDateString() : "—"}</p>
                    <p><span className="text-muted-foreground">Posted:</span> {a.postedDate ? new Date(a.postedDate).toLocaleDateString() : "—"}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <StatusBadge status={a.allocationStatus} />
                    {isUsed ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Used
                      </span>
                    ) : null}
                  </div>
                  <div
                    className="flex flex-wrap gap-1.5 pt-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {a.allocationStatus === "Assigned" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setSharedAlloc(a)}
                      >
                        Mark Shared
                      </Button>
                    )}
                    {(a.allocationStatus === "Assigned" ||
                      a.allocationStatus === "Shared with Customer") && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setPostedAlloc(a)}
                      >
                        Mark Posted
                      </Button>
                    )}
                    {onCancel &&
                      a.allocationStatus !== "Used" &&
                      a.allocationStatus !== "Posted" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-destructive hover:text-destructive"
                          onClick={() => onCancel(a._id)}
                        >
                          Cancel
                        </Button>
                      )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => openActivity(a)}
                    >
                      History
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : null}

      {allocations.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <svg
              className="h-6 w-6 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <p className="text-sm font-medium">No allocations found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Allocations will appear here once created.
          </p>
        </div>
      )}

      <MarkSharedModal
        isOpen={!!sharedAlloc}
        onClose={() => setSharedAlloc(null)}
        onSubmit={async (data) => {
          if (sharedAlloc) {
            await onMarkShared(sharedAlloc._id, data);
            setSharedAlloc(null);
            router.refresh();
          }
        }}
        allocationId={sharedAlloc?._id ?? ""}
        subject={sharedAlloc ? getDraftInfo(sharedAlloc).subject : undefined}
      />

      <MarkPostedModal
        isOpen={!!postedAlloc}
        onClose={() => setPostedAlloc(null)}
        onSubmit={async (data) => {
          if (postedAlloc) {
            await onMarkPosted(postedAlloc._id, data);
            setPostedAlloc(null);
            router.refresh();
          }
        }}
        allocationId={postedAlloc?._id ?? ""}
        subject={postedAlloc ? getDraftInfo(postedAlloc).subject : undefined}
        customerName={postedAlloc?.customerName}
      />

      <ReviewActivityTimeline
        isOpen={!!activityAlloc}
        onClose={() => {
          setActivityAlloc(null);
          setActivity([]);
        }}
        activity={activity}
      />

      <ReviewDetailSidePane
        allocation={detailAlloc}
        isOpen={!!detailAlloc}
        onClose={() => setDetailAlloc(null)}
        onMarkShared={onMarkShared}
        onMarkPosted={onMarkPosted}
        onRefresh={() => router.refresh()}
      />
    </>
  );
}
