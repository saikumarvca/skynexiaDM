"use client";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import type { ReviewDraft } from "@/types/reviews";
import type { Client } from "@/types";
import { X, Copy, Pencil, CopyPlus, UserPlus, Archive, History } from "lucide-react";

interface User {
  _id: string;
  name: string;
}

interface ReviewDraftDetailsPaneProps {
  draft: ReviewDraft | null;
  clients: Client[];
  users: User[];
  assignedToName?: string;
  onClose: () => void;
  onEdit: (draft: ReviewDraft) => void;
  onDuplicate: (id: string) => Promise<void>;
  onCopy: (draft: ReviewDraft) => void;
  onAssign: (draft: ReviewDraft) => void;
  onArchive: (draft: ReviewDraft) => void;
  onViewHistory: (draft: ReviewDraft) => void;
}

function clientName(d: ReviewDraft) {
  const c = d.clientId;
  if (typeof c === "object" && c && "businessName" in c)
    return (c as { businessName?: string }).businessName ?? "—";
  return d.clientName ?? "—";
}

export function ReviewDraftDetailsPane({
  draft,
  assignedToName,
  onClose,
  clients: _clients,
  onEdit,
  onDuplicate,
  onCopy,
  onAssign,
  onArchive,
  onViewHistory,
}: ReviewDraftDetailsPaneProps) {
  if (!draft) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center text-muted-foreground">
        <p className="text-sm">Select a review draft to view details</p>
      </div>
    );
  }

  const isUsed = draft.status === "Used";

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="font-semibold">Details</h3>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div
          key={draft._id}
          className="space-y-6 motion-reduce:animate-none animate-in fade-in-0 slide-in-from-right-2 duration-300"
        >
          <div className="transition-all">
            <h4 className="text-lg font-medium">{draft.subject}</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              Client: {clientName(draft)}
            </p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Assigned to</span>
                {assignedToName ? (
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary ring-1 ring-primary/20">
                    {assignedToName}
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground ring-1 ring-border">
                    Unassigned
                  </span>
                )}
              </div>
              {draft.status !== "Archived" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAssign(draft)}
                  disabled={!draft.reusable && draft.status === "Used"}
                >
                  <UserPlus className="mr-1 h-3.5 w-3.5" />
                  {assignedToName ? "Reassign" : "Assign"}
                </Button>
              )}
            </div>
          </div>

          <div className="transition-all">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Full Review Text
            </p>
            <p className="mt-1 text-sm whitespace-pre-wrap rounded-md bg-muted/50 p-3">
              {draft.reviewText}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 text-sm transition-all sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Category</p>
              <p>{draft.category}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Language</p>
              <p>{draft.language}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Rating</p>
              <p>{draft.suggestedRating} stars</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Tone</p>
              <p>{draft.tone}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Reusable</p>
              <p>{draft.reusable ? "Yes" : "No"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Status</p>
              <StatusBadge status={draft.status} />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Used / Unused</p>
              <p
                className={
                  isUsed
                    ? "text-amber-600 dark:text-amber-400 font-medium"
                    : "text-green-600 dark:text-green-400"
                }
              >
                {isUsed ? "Used" : "Unused"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Created By</p>
              <p>{draft.createdBy}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Created At</p>
              <p>{new Date(draft.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Updated At</p>
              <p>{new Date(draft.updatedAt).toLocaleString()}</p>
            </div>
          </div>

          {draft.notes && (
            <div className="transition-all">
              <p className="text-xs font-medium text-muted-foreground">Notes</p>
              <p className="mt-1 text-sm">{draft.notes}</p>
            </div>
          )}

          <div className="border-t pt-4 transition-all">
            <p className="mb-3 text-xs font-medium text-muted-foreground">Actions</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => onEdit(draft)}>
                <Pencil className="mr-1 h-3.5 w-3.5" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDuplicate(draft._id)}
              >
                <CopyPlus className="mr-1 h-3.5 w-3.5" />
                Duplicate
              </Button>
              <Button variant="outline" size="sm" onClick={() => onCopy(draft)}>
                <Copy className="mr-1 h-3.5 w-3.5" />
                Copy Text
              </Button>
              {draft.status !== "Archived" && (
                <Button variant="outline" size="sm" onClick={() => onArchive(draft)}>
                  <Archive className="mr-1 h-3.5 w-3.5" />
                  Archive
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewHistory(draft)}
              >
                <History className="mr-1 h-3.5 w-3.5" />
                History
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
