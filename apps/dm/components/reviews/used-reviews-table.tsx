"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ReviewActivityTimeline } from "./review-activity-timeline";
import type { PostedReview } from "@/types/reviews";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3152";

function truncate(s: string, len: number) {
  if (!s) return "—";
  return s.length <= len ? s : s.slice(0, len) + "…";
}

function getDraftSubject(pr: PostedReview) {
  const d = pr.draftId;
  if (typeof d === "object" && d && "subject" in d) return (d as { subject?: string }).subject ?? "—";
  return "—";
}

function getDraftPreview(pr: PostedReview) {
  const d = pr.draftId;
  if (typeof d === "object" && d && "reviewText" in d) return (d as { reviewText?: string }).reviewText ?? "—";
  return "—";
}

function getAssignedTo(pr: PostedReview) {
  const a = pr.allocationId;
  if (typeof a === "object" && a && "assignedToUserName" in a) return (a as { assignedToUserName?: string }).assignedToUserName ?? "—";
  return "—";
}

interface UsedReviewsTableProps {
  posted: PostedReview[];
}

export function UsedReviewsTable({ posted }: UsedReviewsTableProps) {
  const [activityPosted, setActivityPosted] = useState<PostedReview | null>(null);
  const [detail, setDetail] = useState<{ posted: PostedReview; activity: { action: string; performedBy: string; performedAt: string }[] } | null>(null);

  const openHistory = async (pr: PostedReview) => {
    setActivityPosted(pr);
    const res = await fetch(
      `${BASE}/api/posted-reviews/${pr._id}`
    );
    const data = await res.json();
    setDetail({ posted: data.posted ?? pr, activity: data.activity ?? [] });
  };

  const activity = detail?.activity ?? [];

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>Draft Preview</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Posted By</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Review Link</TableHead>
              <TableHead>Posted Date</TableHead>
              <TableHead>Proof</TableHead>
              <TableHead className="text-right">History</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posted.map((pr) => (
              <TableRow key={pr._id}>
                <TableCell className="font-medium">{getDraftSubject(pr)}</TableCell>
                <TableCell className="max-w-[200px] truncate" title={getDraftPreview(pr)}>
                  {truncate(getDraftPreview(pr), 60)}
                </TableCell>
                <TableCell>{getAssignedTo(pr)}</TableCell>
                <TableCell>{pr.postedByName}</TableCell>
                <TableCell>{pr.platform}</TableCell>
                <TableCell>
                  {pr.reviewLink ? (
                    <a
                      href={pr.reviewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline truncate block max-w-[120px]"
                    >
                      Link
                    </a>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>{new Date(pr.postedDate).toLocaleDateString()}</TableCell>
                <TableCell>
                  {pr.proofUrl ? (
                    <a
                      href={pr.proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Proof
                    </a>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => openHistory(pr)}>
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {posted.length === 0 && (
        <p className="text-center py-8 text-muted-foreground">No used reviews yet.</p>
      )}

      <ReviewActivityTimeline
        isOpen={!!activityPosted}
        onClose={() => { setActivityPosted(null); setDetail(null); }}
        activity={activity}
        title="Posted Review History"
      />
    </>
  );
}
