"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type ClientOption = { _id: string; name: string; businessName: string };

type ReviewRequestRow = {
  _id: string;
  recipientName: string;
  recipientEmail: string;
  clientId: { _id: string; name: string; businessName: string } | string;
  status: "PENDING" | "SENT" | "FAILED" | "ARCHIVED";
  sentAt?: string | null;
  reviewSubmitted: boolean;
  message?: string;
  createdAt: string;
};

const STATUS_COLORS: Record<string, string> = {
  SENT: "default",
  PENDING: "secondary",
  FAILED: "destructive",
  ARCHIVED: "outline",
};

function clientLabel(c: ReviewRequestRow["clientId"]): string {
  if (typeof c === "string") return c;
  return c.businessName || c.name;
}

export function ReviewRequestsClient({
  initialRequests,
  clients,
}: {
  initialRequests: ReviewRequestRow[];
  clients: ClientOption[];
}) {
  const [requests, setRequests] = useState<ReviewRequestRow[]>(initialRequests);
  const [showArchived, setShowArchived] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    clientId: "",
    recipientName: "",
    recipientEmail: "",
    message: "",
  });

  const openCreate = () => {
    setForm({ clientId: "", recipientName: "", recipientEmail: "", message: "" });
    setFormError(null);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!form.clientId) { setFormError("Select a client"); return; }
    if (!form.recipientName.trim()) { setFormError("Recipient name is required"); return; }
    if (!form.recipientEmail.trim()) { setFormError("Recipient email is required"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/review-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: form.clientId,
          recipientName: form.recipientName.trim(),
          recipientEmail: form.recipientEmail.trim(),
          message: form.message.trim() || undefined,
        }),
      });
      const data = (await res.json()) as { error?: string } & Partial<ReviewRequestRow>;
      if (!res.ok) throw new Error(data.error || "Failed to send request");
      setRequests((prev) => [data as ReviewRequestRow, ...prev]);
      toast.success(
        data.status === "SENT"
          ? "Review request sent!"
          : data.status === "FAILED"
          ? "Request created but email delivery failed"
          : "Review request created"
      );
      setDialogOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkSubmitted = async (id: string, current: boolean) => {
    try {
      const res = await fetch(`/api/review-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewSubmitted: !current }),
      });
      const data = (await res.json()) as { error?: string } & Partial<ReviewRequestRow>;
      if (!res.ok) throw new Error(data.error || "Failed to update");
      setRequests((prev) =>
        prev.map((r) => (r._id === id ? { ...r, reviewSubmitted: !current } : r))
      );
      toast.success(!current ? "Marked as reviewed" : "Marked as pending");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    }
  };

  const handleArchive = async (id: string) => {
    if (!confirm("Archive this review request?")) return;
    try {
      const res = await fetch(`/api/review-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ARCHIVED" }),
      });
      const data = (await res.json()) as { error?: string } & Partial<ReviewRequestRow>;
      if (!res.ok) throw new Error(data.error || "Failed to archive");
      setRequests((prev) =>
        prev.map((r) => (r._id === id ? { ...r, status: "ARCHIVED" } : r))
      );
      toast.success("Request archived");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to archive");
    }
  };

  const visibleRequests = showArchived
    ? requests
    : requests.filter((r) => r.status !== "ARCHIVED");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">
            {visibleRequests.length} review request{visibleRequests.length !== 1 ? "s" : ""}
          </p>
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="h-4 w-4 cursor-pointer rounded border-input"
            />
            Show archived
          </label>
        </div>
        <Button onClick={openCreate}>New request</Button>
      </div>

      {visibleRequests.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">No review requests yet.</p>
          <Button className="mt-4" onClick={openCreate}>Send your first request</Button>
        </div>
      ) : (
        <div className="overflow-auto rounded-lg border bg-card">
          <table className="min-w-[700px] w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">Recipient</th>
                <th className="px-4 py-2.5 text-left font-medium">Client</th>
                <th className="px-4 py-2.5 text-left font-medium">Status</th>
                <th className="px-4 py-2.5 text-left font-medium">Sent</th>
                <th className="px-4 py-2.5 text-left font-medium">Review submitted</th>
                <th className="px-4 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleRequests.map((r) => (
                <tr key={r._id} className={`border-t ${r.status === "ARCHIVED" ? "opacity-60" : ""}`}>
                  <td className="px-4 py-2.5">
                    <div className="font-medium">{r.recipientName}</div>
                    <div className="text-xs text-muted-foreground">{r.recipientEmail}</div>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {clientLabel(r.clientId)}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant={STATUS_COLORS[r.status] as "default" | "secondary" | "destructive" | "outline"}>
                      {r.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {r.sentAt ? new Date(r.sentAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    <button
                      type="button"
                      onClick={() => handleMarkSubmitted(r._id, r.reviewSubmitted)}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        r.reviewSubmitted
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {r.reviewSubmitted ? "Yes" : "No"}
                    </button>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleArchive(r._id)}
                      disabled={r.status === "ARCHIVED"}
                    >
                      Archive
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New review request</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Client</label>
              <Select
                value={form.clientId}
                onValueChange={(v) => setForm((f) => ({ ...f, clientId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.businessName || c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Recipient name</label>
              <Input
                value={form.recipientName}
                onChange={(e) => setForm((f) => ({ ...f, recipientName: e.target.value }))}
                placeholder="Jane Doe"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Recipient email</label>
              <Input
                type="email"
                value={form.recipientEmail}
                onChange={(e) => setForm((f) => ({ ...f, recipientEmail: e.target.value }))}
                placeholder="jane@example.com"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">
                Custom message{" "}
                <span className="text-xs font-normal text-muted-foreground">(optional)</span>
              </label>
              <Textarea
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                placeholder="Add a personal note to the email…"
                rows={3}
              />
            </div>
            {formError && <p className="text-sm text-destructive">{formError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Sending…" : "Send request"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
