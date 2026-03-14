"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { ReviewDraft, AssignDraftFormData } from "@/types/reviews";

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
  assignedByUserId: string;
  assignedByUserName: string;
  isNonReusableUsed?: boolean;
}

export function AssignDraftModal({
  isOpen,
  onClose,
  onSubmit,
  draft,
  users,
  assignedByUserId,
  assignedByUserName,
  isNonReusableUsed = false,
}: AssignDraftModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [assignedToUserId, setAssignedToUserId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerContact, setCustomerContact] = useState("");
  const [platform, setPlatform] = useState("");

  useEffect(() => {
    if (users.length > 0 && !assignedToUserId) {
      setAssignedToUserId(users[0]?._id ?? "");
    }
  }, [users, assignedToUserId]);

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
          <p className="text-sm text-muted-foreground">
            {draft.subject}
          </p>
          {isNonReusableUsed && (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Warning: This draft is not reusable and has already been used.
            </p>
          )}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Assign To *</label>
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
            <label className="block text-sm font-medium mb-1">Customer Name (optional at assign)</label>
            <Input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Praveen"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Customer Contact</label>
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
