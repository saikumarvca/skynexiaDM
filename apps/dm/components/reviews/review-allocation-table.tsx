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
import { StatusBadge } from "@/components/status-badge";
import { MarkSharedModal } from "./mark-shared-modal";
import { MarkPostedModal } from "./mark-posted-modal";
import { ReviewActivityTimeline } from "./review-activity-timeline";
import type { ReviewAllocation } from "@/types/reviews";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

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
  onMarkShared: (id: string, data: { customerName: string; customerContact?: string; platform?: string; sentDate: string }) => Promise<void>;
  onMarkPosted: (id: string, data: { postedByName: string; platform: string; reviewLink: string; proofUrl?: string; postedDate: string; markedUsedBy: string; remarks?: string }) => Promise<void>;
  onCancel?: (id: string) => Promise<void>;
  showMyAssignedOnly?: boolean;
}

export function ReviewAllocationTable({
  allocations,
  onMarkShared,
  onMarkPosted,
  onCancel,
  showMyAssignedOnly = false,
}: ReviewAllocationTableProps) {
  const router = useRouter();
  const [sharedAlloc, setSharedAlloc] = useState<ReviewAllocation | null>(null);
  const [postedAlloc, setPostedAlloc] = useState<ReviewAllocation | null>(null);
  const [activityAlloc, setActivityAlloc] = useState<ReviewAllocation | null>(null);
  const [activity, setActivity] = useState<{ action: string; performedBy: string; performedAt: string }[]>([]);

  const fetchActivity = async (entityType: string, entityId: string) => {
    const res = await fetch(
      `${BASE}/api/review-activity?entityType=${entityType}&entityId=${entityId}`
    );
    return res.json();
  };

  const openActivity = async (a: ReviewAllocation) => {
    setActivityAlloc(a);
    const logs = await fetchActivity("ALLOCATION", a._id);
    setActivity(logs);
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>Draft Preview</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Customer Name</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sent Date</TableHead>
              <TableHead>Posted Date</TableHead>
              <TableHead>Used</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allocations.map((a) => {
              const { subject, preview, clientName } = getDraftInfo(a);
              const isUsed = a.allocationStatus === "Used" || a.allocationStatus === "Posted";
              return (
                <TableRow key={a._id}>
                  <TableCell className="font-medium">{subject}</TableCell>
                  <TableCell className="max-w-[180px] truncate" title={preview}>
                    {truncate(preview, 50)}
                  </TableCell>
                  <TableCell>{clientName}</TableCell>
                  <TableCell>{a.assignedToUserName}</TableCell>
                  <TableCell>{a.customerName ?? "—"}</TableCell>
                  <TableCell>{a.platform ?? "—"}</TableCell>
                  <TableCell>
                    <StatusBadge status={a.allocationStatus} />
                  </TableCell>
                  <TableCell>
                    {a.sentDate ? new Date(a.sentDate).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell>
                    {a.postedDate ? new Date(a.postedDate).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell>
                    {isUsed ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">Used</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {a.allocationStatus === "Assigned" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSharedAlloc(a)}
                        >
                          Mark Shared
                        </Button>
                      )}
                      {(a.allocationStatus === "Assigned" || a.allocationStatus === "Shared with Customer") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPostedAlloc(a)}
                        >
                          Mark Posted / Used
                        </Button>
                      )}
                      {onCancel && a.allocationStatus !== "Used" && a.allocationStatus !== "Posted" && (
                        <Button variant="ghost" size="sm" onClick={() => onCancel(a._id)}>
                          Cancel
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => openActivity(a)}>
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

      {allocations.length === 0 && (
        <p className="text-center py-8 text-muted-foreground">No allocations found.</p>
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
        onClose={() => { setActivityAlloc(null); setActivity([]); }}
        activity={activity}
      />
    </>
  );
}
