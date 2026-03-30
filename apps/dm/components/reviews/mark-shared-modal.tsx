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
import { openWhatsAppChat, parseWhatsAppDigits } from "@/lib/whatsapp-url";
import { resolveClientReviewDestinationsPayload } from "@/lib/infer-review-destination-platform";
import { CustomerContactInputRow } from "@/components/reviews/customer-contact-input-row";

interface MarkSharedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MarkSharedFormData) => Promise<void>;
  allocationId: string;
  subject?: string;
  clientId?: string;
  defaultPlatform?: string;
  defaultCustomerName?: string;
  defaultCustomerContact?: string;
  /** Draft review body for "Send Comments on WA". */
  draftReviewText?: string;
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
  defaultPlatform,
  defaultCustomerName,
  defaultCustomerContact,
  draftReviewText = "",
}: MarkSharedModalProps) {
  const commentBody = (draftReviewText ?? "").trim();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDestination, setIsLoadingDestination] = useState(false);
  const [copiedDestination, setCopiedDestination] = useState(false);
  const [reviewDestinationUrl, setReviewDestinationUrl] = useState("");
  const [reviewQrImageUrl, setReviewQrImageUrl] = useState("");
  const [reviewDestinations, setReviewDestinations] = useState<
    ClientReviewDestination[]
  >([]);
  const [fallbackReviewDestinationUrl, setFallbackReviewDestinationUrl] =
    useState("");
  const [fallbackReviewQrImageUrl, setFallbackReviewQrImageUrl] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerContact, setCustomerContact] = useState("");
  const [platform, setPlatform] = useState("");
  const [sentDate, setSentDate] = useState(
    new Date().toISOString().slice(0, 10),
  );

  useEffect(() => {
    if (!isOpen) return;
    setCustomerName(defaultCustomerName ?? "");
    setCustomerContact(defaultCustomerContact ?? "");
    setPlatform(defaultPlatform ?? "");
    setSentDate(new Date().toISOString().slice(0, 10));
  }, [defaultCustomerContact, defaultCustomerName, defaultPlatform, isOpen]);

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
        const resolved = client
          ? resolveClientReviewDestinationsPayload(client)
          : {
              reviewDestinations: [] as ClientReviewDestination[],
              fallbackReviewDestinationUrl: "",
              fallbackReviewQrImageUrl: "",
            };
        setReviewDestinations(resolved.reviewDestinations);
        setFallbackReviewDestinationUrl(resolved.fallbackReviewDestinationUrl);
        setFallbackReviewQrImageUrl(resolved.fallbackReviewQrImageUrl);
      })
      .catch(() => {
        if (cancelled) return;
        setReviewDestinations([]);
        setFallbackReviewDestinationUrl("");
        setFallbackReviewQrImageUrl("");
        setReviewDestinationUrl("");
        setReviewQrImageUrl("");
      })
      .finally(() => {
        if (!cancelled) setIsLoadingDestination(false);
      });

    return () => {
      cancelled = true;
    };
  }, [clientId, isOpen]);

  useEffect(() => {
    if (!platform) {
      setReviewDestinationUrl("");
      setReviewQrImageUrl("");
      return;
    }
    const matched = reviewDestinations.find(
      (d) => normalizePlatform(d.platform) === normalizePlatform(platform),
    );
    const useLegacyFallback = reviewDestinations.length === 0;
    setReviewDestinationUrl(
      matched?.reviewDestinationUrl ??
        (useLegacyFallback ? fallbackReviewDestinationUrl : "") ??
        "",
    );
    setReviewQrImageUrl(
      matched?.reviewQrImageUrl ??
        (useLegacyFallback ? fallbackReviewQrImageUrl : "") ??
        "",
    );
  }, [
    platform,
    reviewDestinations,
    fallbackReviewDestinationUrl,
    fallbackReviewQrImageUrl,
  ]);

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

  const waPhone = parseWhatsAppDigits(customerContact);
  const showWaButtons = waPhone !== null;
  const destinationMissingForSelectedPlatform = Boolean(
    platform &&
      reviewDestinations.length > 0 &&
      !reviewDestinations.some(
        (d) => normalizePlatform(d.platform) === normalizePlatform(platform),
      ),
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
                  ) : destinationMissingForSelectedPlatform ? (
                    <p className="text-sm text-muted-foreground">
                      No review link saved for {platform}. Add it in the
                      client&apos;s review destinations or choose another
                      platform.
                    </p>
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
                  ) : destinationMissingForSelectedPlatform ? (
                    <p className="text-sm text-muted-foreground">
                      No QR image saved for {platform} for this client.
                    </p>
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
          <CustomerContactInputRow
            value={customerContact}
            onChange={setCustomerContact}
            onCustomerNameChange={setCustomerName}
          />
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
          {showWaButtons ? (
            <div className="space-y-2 rounded-md border border-dashed bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">
                WhatsApp opens in a new tab. Very long messages may be trimmed
                by WhatsApp.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  disabled={
                    !customerName.trim() ||
                    !platform ||
                    !reviewDestinationUrl.trim()
                  }
                  onClick={() => {
                    if (!waPhone) {
                      toast.error(
                        "Enter a valid phone number with country code.",
                      );
                      return;
                    }
                    if (
                      !customerName.trim() ||
                      !platform ||
                      !reviewDestinationUrl.trim()
                    ) {
                      toast.error(
                        "Fill customer name and platform, and ensure a review link is shown above.",
                      );
                      return;
                    }
                    openWhatsAppChat(
                      waPhone,
                      `Dear ${customerName.trim()}, could you please review us on the ${platform} ,${reviewDestinationUrl}.`,
                    );
                  }}
                >
                  Ask review on WA
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  disabled={!commentBody}
                  onClick={() => {
                    if (!waPhone) {
                      toast.error(
                        "Enter a valid phone number with country code.",
                      );
                      return;
                    }
                    if (!commentBody) {
                      toast.error("No review text to send.");
                      return;
                    }
                    openWhatsAppChat(waPhone, commentBody);
                  }}
                >
                  Send Comments on WA
                </Button>
              </div>
            </div>
          ) : null}
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
