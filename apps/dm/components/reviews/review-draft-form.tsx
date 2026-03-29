"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Client } from "@/types";
import type { ReviewDraft, ReviewDraftFormData } from "@/types/reviews";

interface ReviewDraftFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ReviewDraftFormData) => Promise<void>;
  clients: Client[];
  draft?: ReviewDraft | null;
}

const PLATFORMS = [
  "Google",
  "Facebook",
  "Justdial",
  "Website",
  "LinkedIn",
  "Other",
];
const TONES = ["Professional", "Friendly", "Formal", "Casual"];

export function ReviewDraftForm({
  isOpen,
  onClose,
  onSubmit,
  clients,
  draft,
}: ReviewDraftFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ReviewDraftFormData>({
    subject: draft?.subject ?? "",
    reviewText: draft?.reviewText ?? "",
    clientId:
      (typeof draft?.clientId === "object"
        ? draft?.clientId?._id
        : draft?.clientId) ?? "",
    clientName:
      typeof draft?.clientId === "object" &&
      "businessName" in (draft.clientId || {})
        ? ((draft.clientId as { businessName?: string }).businessName ?? "")
        : (draft?.clientName ?? ""),
    category: draft?.category ?? "",
    language: draft?.language ?? "English",
    suggestedRating: draft?.suggestedRating ?? "5",
    tone: draft?.tone ?? "Professional",
    reusable: draft?.reusable ?? true,
    notes: draft?.notes ?? "",
  });

  useEffect(() => {
    if (draft) {
      setFormData({
        subject: draft.subject ?? "",
        reviewText: draft.reviewText ?? "",
        clientId:
          (typeof draft.clientId === "object"
            ? draft.clientId?._id
            : draft.clientId) ?? "",
        clientName:
          typeof draft.clientId === "object" &&
          draft.clientId &&
          "businessName" in draft.clientId
            ? ((draft.clientId as { businessName?: string }).businessName ?? "")
            : (draft.clientName ?? ""),
        category: draft.category ?? "",
        language: draft.language ?? "English",
        suggestedRating: draft.suggestedRating ?? "5",
        tone: draft.tone ?? "Professional",
        reusable: draft.reusable ?? true,
        notes: draft.notes ?? "",
      });
    } else {
      setFormData({
        subject: "",
        reviewText: "",
        clientId: "",
        clientName: "",
        category: "",
        language: "English",
        suggestedRating: "5",
        tone: "Professional",
        reusable: true,
        notes: "",
      });
    }
  }, [draft, isOpen]);

  const handleClientChange = (clientId: string) => {
    const client = clients.find((c) => c._id === clientId);
    setFormData((prev) => ({
      ...prev,
      clientId,
      clientName: client?.businessName ?? client?.name ?? "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSubmit(formData);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {draft ? "Edit Review Draft" : "Create Review Draft"}
          </DialogTitle>
          <DialogDescription>
            Fill the review draft details. Required fields are marked with *.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Subject *</label>
            <Input
              value={formData.subject}
              onChange={(e) =>
                setFormData((p) => ({ ...p, subject: e.target.value }))
              }
              placeholder="e.g. Excellent GST Filing Support"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Review Text *
            </label>
            <Textarea
              value={formData.reviewText}
              onChange={(e) =>
                setFormData((p) => ({ ...p, reviewText: e.target.value }))
              }
              placeholder="Enter the suggested review comment..."
              rows={5}
              required
              className="resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Client *</label>
            <select
              value={formData.clientId}
              onChange={(e) => handleClientChange(e.target.value)}
              required
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              <option value="">Select client</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.businessName}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1">
                Category *
              </label>
              <Input
                value={formData.category}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, category: e.target.value }))
                }
                placeholder="e.g. Service"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Language *
              </label>
              <Input
                value={formData.language}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, language: e.target.value }))
                }
                placeholder="e.g. English"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1">
                Suggested Rating
              </label>
              <select
                value={formData.suggestedRating}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    suggestedRating: e.target.value,
                  }))
                }
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                {["3", "4", "5"].map((r) => (
                  <option key={r} value={r}>
                    {r} stars
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tone</label>
              <select
                value={formData.tone}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, tone: e.target.value }))
                }
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                {TONES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="reusable"
              checked={formData.reusable}
              onChange={(e) =>
                setFormData((p) => ({ ...p, reusable: e.target.checked }))
              }
              className="rounded border-input"
            />
            <label htmlFor="reusable" className="text-sm font-medium">
              Reusable (can be used multiple times)
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <Textarea
              value={formData.notes ?? ""}
              onChange={(e) =>
                setFormData((p) => ({ ...p, notes: e.target.value }))
              }
              placeholder="Optional notes"
              rows={2}
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : draft ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
