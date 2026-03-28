"use client";

import { useState } from "react";
import { toast } from "sonner";
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
import type { MarkPostedFormData } from "@/types/reviews";

interface MarkPostedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MarkPostedFormData) => Promise<void>;
  allocationId: string;
  subject?: string;
  customerName?: string;
  markedUsedBy?: string;
}

export function MarkPostedModal({
  isOpen,
  onClose,
  onSubmit,
  allocationId,
  subject,
  customerName: initialCustomer,
  markedUsedBy: initialMarkedBy,
}: MarkPostedModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [postedByName, setPostedByName] = useState(initialCustomer ?? "");
  const [platform, setPlatform] = useState("Google");
  const [reviewLink, setReviewLink] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [postedDate, setPostedDate] = useState(new Date().toISOString().slice(0, 10));
  const [markedUsedBy, setMarkedUsedBy] = useState(initialMarkedBy ?? "");
  const [remarks, setRemarks] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postedByName.trim() || !platform || !reviewLink.trim() || !postedDate) return;
    setIsLoading(true);
    try {
      await onSubmit({
        postedByName: postedByName.trim(),
        platform,
        reviewLink: reviewLink.trim(),
        proofUrl: proofUrl || undefined,
        postedDate,
        markedUsedBy: markedUsedBy.trim() || "system",
        remarks: remarks || undefined,
      });
      toast.success("Review marked complete");
      onClose();
      setPostedByName("");
      setPlatform("Google");
      setReviewLink("");
      setProofUrl("");
      setPostedDate(new Date().toISOString().slice(0, 10));
      setMarkedUsedBy("");
      setRemarks("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save posting details");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Mark as Posted / Used</DialogTitle>
          {subject ? (
            <DialogDescription>{subject}</DialogDescription>
          ) : (
            <DialogDescription>Enter posting details and the review link.</DialogDescription>
          )}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Posted By (Customer Name) *</label>
            <Input
              value={postedByName}
              onChange={(e) => setPostedByName(e.target.value)}
              placeholder="e.g. Praveen"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Platform *</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              required
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              <option value="Google">Google</option>
              <option value="Facebook">Facebook</option>
              <option value="Justdial">Justdial</option>
              <option value="Website">Website</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Review Link *</label>
            <Input
              value={reviewLink}
              onChange={(e) => setReviewLink(e.target.value)}
              placeholder="https://..."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Proof URL (screenshot)</label>
            <Input
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Posted Date *</label>
            <Input
              type="date"
              value={postedDate}
              onChange={(e) => setPostedDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Marked Used By</label>
            <Input
              value={markedUsedBy}
              onChange={(e) => setMarkedUsedBy(e.target.value)}
              placeholder="Team member name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Remarks</label>
            <Textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={2}
              placeholder="Optional notes"
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Mark Posted & Used"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
