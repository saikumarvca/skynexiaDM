"use client";

import { useState } from "react";
import { useEffect } from "react";
import { toast } from "sonner";
import { Copy, Check } from "lucide-react";
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
  clientId?: string;
}

type ClientReviewDestination = {
  platform: string;
  reviewDestinationUrl?: string;
  reviewQrImageUrl?: string;
};

function normalizePlatform(v: string) {
  const s = v.trim().toLowerCase();
  if (s === "justdail") return "justdial";
  return s;
}

export function MarkSharedModal({
  isOpen,
  onClose,
  onSubmit,
  allocationId,
  subject,
  clientId,
}: MarkSharedModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDestination, setIsLoadingDestination] = useState(false);
  const [copiedDestination, setCopiedDestination] = useState(false);
  const [reviewDestinationUrl, setReviewDestinationUrl] = useState("");
  const [reviewQrImageUrl, setReviewQrImageUrl] = useState("");
  const [reviewDestinations, setReviewDestinations] = useState<
    ClientReviewDestination[]
  >([]);
  const [customerName, setCustomerName] = useState("");
  const [customerContact, setCustomerContact] = useState("");
  const [platform, setPlatform] = useState("");
  const [sentDate, setSentDate] = useState(
    new Date().toISOString().slice(0, 10),
  );

  useEffect(() => {
    if (!isOpen || !clientId) return;
    let cancelled = false;
    setIsLoadingDestination(true);
    fetch(`/api/clients/${clientId}`)
      .then(async (res) => {
        if (!res.ok) return null;
        return (await res.json()) as {
          reviewDestinationUrl?: string;
          reviewQrImageUrl?: string;
          reviewDestinations?: ClientReviewDestination[];
        };
      })
      .then((client) => {
        if (cancelled) return;
        const list = client?.reviewDestinations ?? [];
        setReviewDestinations(list);
        const matched =
          list.find(
            (d) =>
              platform &&
              normalizePlatform(d.platform) === normalizePlatform(platform),
          ) ?? list[0];
        setReviewDestinationUrl(
          matched?.reviewDestinationUrl ?? client?.reviewDestinationUrl ?? "",
        );
        setReviewQrImageUrl(
          matched?.reviewQrImageUrl ?? client?.reviewQrImageUrl ?? "",
        );
      })
      .catch(() => {
        if (cancelled) return;
        setReviewDestinations([]);
        setReviewDestinationUrl("");
        setReviewQrImageUrl("");
      })
      .finally(() => {
        if (!cancelled) setIsLoadingDestination(false);
      });

    return () => {
      cancelled = true;
    };
  }, [clientId, isOpen, platform]);

  const handleCopyDestination = async () => {
    if (!reviewDestinationUrl) return;
    try {
      await navigator.clipboard.writeText(reviewDestinationUrl);
      setCopiedDestination(true);
      setTimeout(() => setCopiedDestination(false), 1500);
      toast.success("Review destination link copied");
    } catch {
      toast.error("Could not copy destination link");
    }
  };

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
          <div className="rounded-md border bg-muted/40 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Review destination
            </p>
            {isLoadingDestination ? (
              <p className="text-sm text-muted-foreground">Loading destination...</p>
            ) : (
              <div className="space-y-3">
                {platform ? (
                  <p className="text-xs text-muted-foreground">
                    Showing destination for platform: {platform}
                  </p>
                ) : reviewDestinations.length > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Select platform to switch destination.
                  </p>
                ) : null}
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Link
                  </label>
                  {reviewDestinationUrl ? (
                    <div className="flex items-center gap-2">
                      <Input value={reviewDestinationUrl} readOnly />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleCopyDestination}
                        title="Copy destination link"
                      >
                        {copiedDestination ? (
                          <Check className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No review destination URL configured for this client.
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Scanner (QR)
                  </label>
                  {reviewQrImageUrl ? (
                    <img
                      src={reviewQrImageUrl}
                      alt="Client review QR code"
                      className="h-28 w-28 rounded border object-contain bg-background"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No QR image configured for this client.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
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
