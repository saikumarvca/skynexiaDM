"use client";

import { useState, useEffect } from "react";
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
import type { ReviewDraft, AssignDraftFormData } from "@/types/reviews";
import type { Client } from "@/types";
import { CustomerContactInputRow } from "@/components/reviews/customer-contact-input-row";

interface User {
  _id: string;
  name: string;
  email?: string;
}

interface AssignDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AssignDraftFormData) => Promise<void>;
  draft: ReviewDraft | null;
  users: User[];
  clients?: Client[];
  assignedByUserId: string;
  assignedByUserName: string;
  isNonReusableUsed?: boolean;
}

const DEFAULT_PLATFORMS = ["Google", "Facebook", "Justdial", "Website", "Other"];

export function AssignDraftModal({
  isOpen,
  onClose,
  onSubmit,
  draft,
  users,
  clients,
  assignedByUserId,
  assignedByUserName,
  isNonReusableUsed = false,
}: AssignDraftModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [assignedToUserId, setAssignedToUserId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerContact, setCustomerContact] = useState("");
  const [platform, setPlatform] = useState("");
  const [contactSuggestions, setContactSuggestions] = useState<
    { customerContact: string; customerName: string }[]
  >([]);

  // Derive the draft's client, then surface only platforms that client has configured
  const draftClientId =
    draft?.clientId != null
      ? typeof draft.clientId === "string"
        ? draft.clientId
        : (draft.clientId as { _id?: string })?._id ?? ""
      : "";
  const matchingClient = clients?.find((c) => c._id === draftClientId);
  const availablePlatforms =
    matchingClient?.reviewDestinations && matchingClient.reviewDestinations.length > 0
      ? matchingClient.reviewDestinations.map((d) => d.platform)
      : DEFAULT_PLATFORMS;

  useEffect(() => {
    if (users.length > 0 && !assignedToUserId) {
      setAssignedToUserId(users[0]?._id ?? "");
    }
  }, [users, assignedToUserId]);

  // Fetch past contacts for this client when the modal opens
  useEffect(() => {
    if (!isOpen || !draftClientId) return;
    let cancelled = false;
    fetch(`/api/review-allocations?groupByContact=true&clientId=${draftClientId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (!cancelled)
          setContactSuggestions(
            (data as { customerContact: string; customerName: string }[]) ?? [],
          );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isOpen, draftClientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft || !assignedToUserId) return;
    const user = users.find((u) => u._id === assignedToUserId);
    setIsLoading(true);
    try {
      await onSubmit({
        draftId: draft._id,
        assignedToUserId,
        assignedToUserName: user?.name ?? "",
        assignedByUserId,
        assignedByUserName,
        customerName: customerName || undefined,
        customerContact: customerContact || undefined,
        platform: platform || undefined,
      });
      onClose();
      setAssignedToUserId(users[0]?._id ?? "");
      setCustomerName("");
      setCustomerContact("");
      setPlatform("");
    } finally {
      setIsLoading(false);
    }
  };

  if (!draft) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Draft to Team Member</DialogTitle>
          <DialogDescription>{draft.subject}</DialogDescription>
          {isNonReusableUsed && (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Warning: This draft is not reusable and has already been used.
            </p>
          )}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Assign To *
            </label>
            <select
              value={assignedToUserId}
              onChange={(e) => setAssignedToUserId(e.target.value)}
              required
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              <option value="">Select team member</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Customer Name (optional at assign)
            </label>
            <Input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Praveen"
            />
          </div>
          <CustomerContactInputRow
            value={customerContact}
            onChange={setCustomerContact}
            onCustomerNameChange={setCustomerName}
            contactBookFilterTags={["Review request"]}
          />
          {contactSuggestions.length > 0 && !customerContact && (
            <div>
              <p className="mb-1 text-xs text-muted-foreground">
                Recent contacts for this client:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {contactSuggestions.map((s) => (
                  <button
                    key={s.customerContact}
                    type="button"
                    onClick={() => {
                      setCustomerContact(s.customerContact);
                      if (s.customerName && !customerName)
                        setCustomerName(s.customerName);
                    }}
                    className="rounded border border-border bg-muted px-2 py-0.5 text-xs hover:bg-accent"
                  >
                    {s.customerName
                      ? `${s.customerName} · ${s.customerContact}`
                      : s.customerContact}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Platform</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              <option value="">Select platform</option>
              {availablePlatforms.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            {matchingClient?.reviewDestinations &&
              matchingClient.reviewDestinations.length > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Showing platforms configured for this client
                </p>
              )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || isNonReusableUsed}>
              {isLoading ? "Assigning..." : "Assign"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
