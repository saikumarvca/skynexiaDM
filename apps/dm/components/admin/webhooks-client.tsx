"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const ALL_EVENTS = [
  "lead.created",
  "campaign.created",
  "campaign.updated",
  "review.used",
  "task.created",
  "task.updated",
] as const;

type WebhookRow = {
  _id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  lastTriggeredAt?: string | null;
  secret?: string;
};

type FormState = {
  name: string;
  url: string;
  events: string[];
  secret: string;
  isActive: boolean;
};

const emptyForm = (): FormState => ({
  name: "",
  url: "",
  events: [],
  secret: "",
  isActive: true,
});

export function WebhooksClient({ initialWebhooks }: { initialWebhooks: WebhookRow[] }) {
  const [webhooks, setWebhooks] = useState<WebhookRow[]>(initialWebhooks);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setFormError(null);
    setDialogOpen(true);
  };

  const openEdit = (w: WebhookRow) => {
    setEditingId(w._id);
    setForm({
      name: w.name,
      url: w.url,
      events: w.events,
      secret: w.secret ?? "",
      isActive: w.isActive,
    });
    setFormError(null);
    setDialogOpen(true);
  };

  const toggleEvent = (ev: string) => {
    setForm((f) => ({
      ...f,
      events: f.events.includes(ev)
        ? f.events.filter((e) => e !== ev)
        : [...f.events, ev],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!form.name.trim()) { setFormError("Name is required"); return; }
    if (!form.url.trim()) { setFormError("URL is required"); return; }
    if (form.events.length === 0) { setFormError("Select at least one event"); return; }
    try { new URL(form.url.trim()); } catch { setFormError("URL must be a valid URL"); return; }

    setLoading(true);
    try {
      const body = {
        name: form.name.trim(),
        url: form.url.trim(),
        events: form.events,
        secret: form.secret.trim() || undefined,
        isActive: form.isActive,
      };

      if (editingId) {
        const res = await fetch(`/api/webhooks/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = (await res.json()) as { error?: string } & Partial<WebhookRow>;
        if (!res.ok) throw new Error(data.error || "Failed to update webhook");
        setWebhooks((prev) =>
          prev.map((w) =>
            w._id === editingId ? { ...w, ...data, _id: editingId } : w
          )
        );
        toast.success("Webhook updated");
      } else {
        const res = await fetch("/api/webhooks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = (await res.json()) as { error?: string } & Partial<WebhookRow>;
        if (!res.ok) throw new Error(data.error || "Failed to create webhook");
        setWebhooks((prev) => [data as WebhookRow, ...prev]);
        toast.success("Webhook created");
      }
      setDialogOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };


  const handleTest = async (id: string) => {
    setTestingId(id);
    try {
      const res = await fetch(`/api/webhooks/${id}/test`, { method: "POST" });
      const data = (await res.json()) as { success?: boolean; statusCode?: number; error?: string };
      if (!res.ok) throw new Error(data.error || "Test failed");
      if (data.success) {
        toast.success(`Test delivered (HTTP ${data.statusCode ?? "?"})`);
      } else {
        toast.warning(`Test sent but endpoint returned HTTP ${data.statusCode ?? "error"}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Test failed");
    } finally {
      setTestingId(null);
    }
  };

  const handleToggleActive = async (w: WebhookRow) => {
    try {
      const res = await fetch(`/api/webhooks/${w._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !w.isActive }),
      });
      const data = (await res.json()) as { error?: string } & Partial<WebhookRow>;
      if (!res.ok) throw new Error(data.error || "Failed to update");
      setWebhooks((prev) =>
        prev.map((wh) => (wh._id === w._id ? { ...wh, isActive: !w.isActive } : wh))
      );
      toast.success(`Webhook ${!w.isActive ? "enabled" : "disabled"}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to toggle");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {webhooks.length} webhook{webhooks.length !== 1 ? "s" : ""} configured
        </p>
        <Button onClick={openCreate}>Add webhook</Button>
      </div>

      {webhooks.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">No webhooks configured yet.</p>
          <Button className="mt-4" onClick={openCreate}>Add your first webhook</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {webhooks.map((w) => (
            <div key={w._id} className="rounded-lg border bg-card p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{w.name}</span>
                    <Badge variant={w.isActive ? "default" : "secondary"}>
                      {w.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="truncate text-sm text-muted-foreground">{w.url}</p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {w.events.map((ev) => (
                      <Badge key={ev} variant="outline" className="text-xs font-mono">
                        {ev}
                      </Badge>
                    ))}
                  </div>
                  {w.lastTriggeredAt && (
                    <p className="text-xs text-muted-foreground">
                      Last triggered: {new Date(w.lastTriggeredAt).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTest(w._id)}
                    disabled={testingId === w._id}
                  >
                    {testingId === w._id ? "Testing…" : "Test"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openEdit(w)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleActive(w)}
                  >
                    {w.isActive ? "Disable" : "Enable"}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit webhook" : "Add webhook"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Slack notifications"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">URL</label>
              <Input
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                placeholder="https://example.com/webhook"
                type="url"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Events</label>
              <div className="flex flex-wrap gap-2">
                {ALL_EVENTS.map((ev) => (
                  <button
                    key={ev}
                    type="button"
                    onClick={() => toggleEvent(ev)}
                    className={`rounded-md border px-2 py-1 text-xs font-mono transition-colors ${
                      form.events.includes(ev)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {ev}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">
                Secret{" "}
                <span className="text-xs font-normal text-muted-foreground">(optional, for HMAC signature)</span>
              </label>
              <Input
                value={form.secret}
                onChange={(e) => setForm((f) => ({ ...f, secret: e.target.value }))}
                placeholder="your-secret-key"
              />
            </div>
            {editingId && (
              <div className="flex items-center gap-2">
                <input
                  id="wh-active"
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="h-4 w-4"
                />
                <label htmlFor="wh-active" className="text-sm">Active</label>
              </div>
            )}
            {formError && <p className="text-sm text-destructive">{formError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving…" : editingId ? "Save changes" : "Create webhook"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
