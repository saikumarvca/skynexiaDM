"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  openWhatsAppChat,
  openTelCall,
  parseWhatsAppDigits,
  buildReviewPostedFollowUpMessage,
} from "@/lib/whatsapp-url";
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
  customerContact?: string;
  markedUsedBy?: string;
  teamMembers?: { _id: string; name: string }[];
}

export function MarkPostedModal({
  isOpen,
  onClose,
  onSubmit,
  allocationId,
  subject,
  customerName: initialCustomer,
  customerContact: initialCustomerContact,
  markedUsedBy: initialMarkedBy,
  teamMembers = [],
}: MarkPostedModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [postedByName, setPostedByName] = useState(initialCustomer ?? "");
  const [postedContact, setPostedContact] = useState(
    initialCustomerContact ?? "",
  );
  const [platform, setPlatform] = useState("Google");
  const [reviewLink, setReviewLink] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [postedDate, setPostedDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [markedUsedBy, setMarkedUsedBy] = useState(initialMarkedBy ?? "");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setPostedByName(initialCustomer ?? "");
    setPostedContact(initialCustomerContact ?? "");
    setPlatform("Google");
    setReviewLink("");
    setProofUrl("");
    setPostedDate(new Date().toISOString().slice(0, 10));
    setMarkedUsedBy(initialMarkedBy ?? "");
    setRemarks("");
  }, [
    isOpen,
    initialCustomer,
    initialCustomerContact,
    initialMarkedBy,
  ]);

  const waPhone = parseWhatsAppDigits(postedContact);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postedByName.trim() || !platform || !reviewLink.trim() || !postedDate)
      return;
    setIsLoading(true);
    try {
      await onSubmit({
        postedByName: postedByName.trim(),
        customerContact: postedContact.trim() || undefined,
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
      setPostedContact("");
      setPlatform("Google");
      setReviewLink("");
      setProofUrl("");
      setPostedDate(new Date().toISOString().slice(0, 10));
      setMarkedUsedBy("");
      setRemarks("");
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Could not save posting details",
      );
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
            <DialogDescription>
              Enter posting details and the review link.
            </DialogDescription>
          )}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Posted By (Customer Name) *
            </label>
            <Input
              value={postedByName}
              onChange={(e) => setPostedByName(e.target.value)}
              placeholder="e.g. Praveen"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Contact Number
            </label>
            <div className="flex gap-2">
              <Input
                className="flex-1 min-w-0"
                value={postedContact}
                onChange={(e) => setPostedContact(e.target.value)}
                placeholder="Phone (with country code) or email"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0"
                disabled={!waPhone}
                title="Call"
                onClick={() => openTelCall(postedContact)}
              >
                <Phone className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0"
                disabled={!waPhone}
                title="Follow up on WhatsApp"
                onClick={() => {
                  if (!waPhone) return;
                  openWhatsAppChat(
                    waPhone,
                    buildReviewPostedFollowUpMessage(postedByName),
                  );
                }}
              >
                <MessageCircle className="h-4 w-4 text-emerald-600" />
              </Button>
            </div>
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
            <label className="block text-sm font-medium mb-1">
              Review Link *
            </label>
            <Input
              value={reviewLink}
              onChange={(e) => setReviewLink(e.target.value)}
              placeholder="https://..."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Proof URL (screenshot)
            </label>
            <Input
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Posted Date *
            </label>
            <Input
              type="date"
              value={postedDate}
              onChange={(e) => setPostedDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Marked Used By
            </label>
            <select
              value={markedUsedBy}
              onChange={(e) => setMarkedUsedBy(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              <option value="">Select team member</option>
              {teamMembers.map((member) => (
                <option key={member._id} value={member.name}>
                  {member.name}
                </option>
              ))}
            </select>
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
