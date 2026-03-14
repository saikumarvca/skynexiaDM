"use client";

import { useState, useEffect } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { ReviewAllocation } from "@/types/reviews";
import type { MarkSharedFormData, MarkPostedFormData } from "@/types/reviews";

function getDraftInfo(a: ReviewAllocation) {
  const d = a.draftId;
  if (typeof d === "object" && d) {
    return {
      subject: (d as { subject?: string }).subject ?? "—",
      description: (d as { reviewText?: string }).reviewText ?? "—",
    };
  }
  return { subject: "—", description: "—" };
}

interface ReviewDetailSidePaneProps {
  allocation: ReviewAllocation | null;
  isOpen: boolean;
  onClose: () => void;
  onMarkShared: (id: string, data: MarkSharedFormData) => Promise<void>;
  onMarkPosted: (id: string, data: MarkPostedFormData) => Promise<void>;
  onRefresh: () => void;
}

export function ReviewDetailSidePane({
  allocation,
  isOpen,
  onClose,
  onMarkShared,
  onMarkPosted,
  onRefresh,
}: ReviewDetailSidePaneProps) {
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerContact, setCustomerContact] = useState("");
  const [platform, setPlatform] = useState("");
  const [sentDate, setSentDate] = useState(new Date().toISOString().slice(0, 10));
  const [postedByName, setPostedByName] = useState("");
  const [postedPlatform, setPostedPlatform] = useState("Google");
  const [reviewLink, setReviewLink] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [postedDate, setPostedDate] = useState(new Date().toISOString().slice(0, 10));
  const [markedUsedBy, setMarkedUsedBy] = useState("");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (allocation) {
      setCustomerName(allocation.customerName ?? "");
      setCustomerContact(allocation.customerContact ?? "");
      setPlatform(allocation.platform ?? "");
      setSentDate(
        allocation.sentDate
          ? new Date(allocation.sentDate).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10)
      );
      setPostedByName(allocation.customerName ?? "");
      setPostedPlatform(allocation.platform ?? "Google");
      setPostedDate(new Date().toISOString().slice(0, 10));
    }
  }, [allocation?._id]);

  if (!allocation) return null;

  const { subject, description } = getDraftInfo(allocation);
  const canMarkShared = allocation.allocationStatus === "Assigned";
  const canMarkPosted =
    allocation.allocationStatus === "Assigned" || allocation.allocationStatus === "Shared with Customer";

  const handleCopy = async () => {
    const text = `Subject: ${subject}\n\nDescription:\n${description}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMarkShared = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) return;
    setIsLoading(true);
    try {
      await onMarkShared(allocation._id, {
        customerName: customerName.trim(),
        customerContact: customerContact || undefined,
        platform: platform || undefined,
        sentDate,
      });
      onClose();
      onRefresh();
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkPosted = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postedByName.trim() || !postedPlatform || !reviewLink.trim()) return;
    setIsLoading(true);
    try {
      await onMarkPosted(allocation._id, {
        postedByName: postedByName.trim(),
        platform: postedPlatform,
        reviewLink: reviewLink.trim(),
        proofUrl: proofUrl || undefined,
        postedDate,
        markedUsedBy: markedUsedBy.trim() || "system",
        remarks: remarks || undefined,
      });
      onClose();
      onRefresh();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="flex flex-col overflow-hidden sm:max-w-lg">
        <SheetHeader className="flex-shrink-0 pr-8 pb-4 border-b">
          <div className="flex items-start justify-between gap-2">
            <SheetTitle className="text-base font-semibold leading-snug pr-6">
              {subject}
            </SheetTitle>
            <button
              type="button"
              onClick={handleCopy}
              className="flex-shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Copy subject and description"
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
          <div className="mt-3 text-sm text-muted-foreground overflow-y-auto max-h-28 rounded-lg border bg-slate-50 dark:bg-gray-900 p-3 leading-relaxed">
            {description}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-5 space-y-5 pr-1 scrollbar-thin">
          {canMarkShared && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Mark as Shared</h3>
              <form onSubmit={handleMarkShared} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Customer Name <span className="text-destructive">*</span></label>
                  <Input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Praveen"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Customer Contact</label>
                  <Input
                    value={customerContact}
                    onChange={(e) => setCustomerContact(e.target.value)}
                    placeholder="Email or phone"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Platform</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">Select platform</option>
                    <option value="Google">Google</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Justdial">Justdial</option>
                    <option value="Website">Website</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Sent Date <span className="text-destructive">*</span></label>
                  <Input
                    type="date"
                    value={sentDate}
                    onChange={(e) => setSentDate(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" disabled={isLoading} className="w-full mt-1">
                  {isLoading ? "Saving..." : "Mark Shared"}
                </Button>
              </form>
            </section>
          )}

          {canMarkPosted && !canMarkShared && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Mark as Posted & Used</h3>
              <form onSubmit={handleMarkPosted} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Posted By (Customer Name) <span className="text-destructive">*</span></label>
                  <Input
                    value={postedByName}
                    onChange={(e) => setPostedByName(e.target.value)}
                    placeholder="e.g. Praveen"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Platform <span className="text-destructive">*</span></label>
                  <select
                    value={postedPlatform}
                    onChange={(e) => setPostedPlatform(e.target.value)}
                    required
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="Google">Google</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Justdial">Justdial</option>
                    <option value="Website">Website</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Review Link <span className="text-destructive">*</span></label>
                  <Input
                    value={reviewLink}
                    onChange={(e) => setReviewLink(e.target.value)}
                    placeholder="https://..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Proof URL <span className="text-xs font-normal text-muted-foreground">(screenshot)</span></label>
                  <Input
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Posted Date <span className="text-destructive">*</span></label>
                  <Input
                    type="date"
                    value={postedDate}
                    onChange={(e) => setPostedDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Marked Used By</label>
                  <Input
                    value={markedUsedBy}
                    onChange={(e) => setMarkedUsedBy(e.target.value)}
                    placeholder="Team member name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Remarks</label>
                  <Input
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Optional notes"
                  />
                </div>
                <Button type="submit" disabled={isLoading} className="w-full mt-1">
                  {isLoading ? "Saving..." : "Mark Posted & Used"}
                </Button>
              </form>
            </section>
          )}

          {(allocation.allocationStatus === "Posted" || allocation.allocationStatus === "Used") && (
            <div className="flex items-center gap-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 p-4">
              <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
                <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Review Completed</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">This review has been marked as used.</p>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
