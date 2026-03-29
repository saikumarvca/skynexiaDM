"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { MarkSharedFormData } from "@/types/reviews";

interface MarkSharedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MarkSharedFormData) => Promise<void>;
  allocationId: string;
  subject?: string;
}

export function MarkSharedModal({
  isOpen,
  onClose,
  onSubmit,
  allocationId,
  subject,
}: MarkSharedModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerContact, setCustomerContact] = useState("");
  const [platform, setPlatform] = useState("");
  const [sentDate, setSentDate] = useState(
    new Date().toISOString().slice(0, 10),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) return;
    setIsLoading(true);
    try {
      await onSubmit({
        customerName: customerName.trim(),
        customerContact: customerContact || undefined,
        platform: platform || undefined,
        sentDate,
      });
      toast.success("Marked as shared with customer");
      onClose();
      setCustomerName("");
      setCustomerContact("");
      setPlatform("");
      setSentDate(new Date().toISOString().slice(0, 10));
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Could not update allocation",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark as Shared with Customer</DialogTitle>
          {subject ? (
            <DialogDescription>{subject}</DialogDescription>
          ) : (
            <DialogDescription>
              Enter the customer details and sent date.
            </DialogDescription>
          )}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Customer Name *
            </label>
            <Input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Praveen"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Customer Contact
            </label>
            <Input
              value={customerContact}
              onChange={(e) => setCustomerContact(e.target.value)}
              placeholder="Email or phone"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Platform</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
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
            <label className="block text-sm font-medium mb-1">
              Sent Date *
            </label>
            <Input
              type="date"
              value={sentDate}
              onChange={(e) => setSentDate(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Mark Shared"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
