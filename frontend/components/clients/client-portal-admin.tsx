"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  ExternalLink,
  History,
  Loader2,
  Megaphone,
  RefreshCw,
  Send,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDateTime } from "@/components/client-portal/format";
import { ActivityIcon } from "@/components/client-portal/activity-icon";
import { RoleBadge } from "@/components/client-portal/ui/primitives";
import {
  PORTAL_CATEGORY_LABEL,
  PORTAL_UPDATE_CATEGORY_LABEL,
  type ClientActivityItem,
  type Paginated,
} from "@/lib/client-portal/dto";
import type { AdminClientUpdate } from "@/lib/client-portal/updates";
import type { ClientUpdateCategory } from "@/models/ClientUpdate";

type StaffEvent = ClientActivityItem & { visibility: "INTERNAL" | "CLIENT_VISIBLE"; source: string };
type ClientLogin = { id: string; name: string; email: string; isActive: boolean; createdAt: string };

const UPDATE_CATEGORIES = Object.keys(PORTAL_UPDATE_CATEGORY_LABEL) as ClientUpdateCategory[];

async function readJson<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

// ─── Preview ─────────────────────────────────────────────────────────────────

export function PreviewPortalButton({
  clientId,
  variant = "default",
  size = "default",
}: {
  clientId: string;
  variant?: "default" | "outline";
  size?: "default" | "sm";
}) {
  const [loading, setLoading] = useState(false);
  const start = async () => {
    setLoading(true);
    try {
      const data = await readJson<{ redirectTo: string }>(
        await fetch(`/api/clients/${clientId}/portal/preview`, { method: "POST" }),
      );
      window.open(data.redirectTo, "_blank", "noopener");
      toast.success("Preview started in a new tab (read-only, expires in 1 hour)");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start preview");
    } finally {
      setLoading(false);
    }
  };
  return (
    <Button variant={variant} size={size} onClick={() => void start()} disabled={loading}>
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
      Preview Client Portal
    </Button>
  );
}

// ─── Updates ─────────────────────────────────────────────────────────────────

function UpdateComposer({ clientId, onCreated }: { clientId: string; onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<ClientUpdateCategory>("ANNOUNCEMENT");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [relatedLabel, setRelatedLabel] = useState("");
  const [visible, setVisible] = useState(true);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await readJson(
        await fetch(`/api/clients/${clientId}/portal/updates`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            body: body.trim(),
            category,
            isPublished: visible,
            linkUrl: linkUrl.trim() || null,
            linkLabel: linkLabel.trim() || null,
            relatedLabel: relatedLabel.trim() || null,
          }),
        }),
      );
      toast.success(visible ? "Update published to the client" : "Saved as internal draft");
      setTitle("");
      setBody("");
      setLinkUrl("");
      setLinkLabel("");
      setRelatedLabel("");
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save update");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border bg-muted/30 p-4">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_200px]">
        <div className="space-y-1">
          <label htmlFor="update-title" className="text-sm font-medium">
            Title
          </label>
          <Input
            id="update-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. 10 new review drafts prepared"
            maxLength={160}
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="update-category">
            Category
          </label>
          <Select value={category} onValueChange={(v) => setCategory(v as ClientUpdateCategory)}>
            <SelectTrigger id="update-category" className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              {UPDATE_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {PORTAL_UPDATE_CATEGORY_LABEL[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1">
        <label htmlFor="update-body" className="text-sm font-medium">
          Message
        </label>
        <Textarea
          id="update-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What should the client know?"
          rows={4}
          maxLength={5000}
          required
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <label htmlFor="update-related" className="text-sm font-medium">
            Related item (optional)
          </label>
          <Input
            id="update-related"
            value={relatedLabel}
            onChange={(e) => setRelatedLabel(e.target.value)}
            placeholder="e.g. Google review campaign"
            maxLength={160}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="update-link" className="text-sm font-medium">
            Link URL (optional)
          </label>
          <Input
            id="update-link"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://"
            type="url"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="update-link-label" className="text-sm font-medium">
            Link label (optional)
          </label>
          <Input
            id="update-link-label"
            value={linkLabel}
            onChange={(e) => setLinkLabel(e.target.value)}
            placeholder="Open report"
            maxLength={120}
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={visible}
            onChange={(e) => setVisible(e.target.checked)}
            className="h-4 w-4 rounded border-input accent-[hsl(var(--primary))]"
          />
          Visible to client
          <span className="text-xs text-muted-foreground">
            {visible ? "(publishes now and notifies client logins)" : "(kept as an internal draft)"}
          </span>
        </label>
        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          {visible ? "Publish update" : "Save draft"}
        </Button>
      </div>
    </form>
  );
}

function UpdatesPanel({ clientId }: { clientId: string }) {
  const [data, setData] = useState<Paginated<AdminClientUpdate> | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    fetch(`/api/clients/${clientId}/portal/updates?pageSize=50`, { cache: "no-store" })
      .then((res) => readJson<Paginated<AdminClientUpdate>>(res))
      .then((d) => setData(d))
      .catch((e) => toast.error(e instanceof Error ? e.message : "Could not load updates"))
      .finally(() => setLoading(false));
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async (u: AdminClientUpdate) => {
    try {
      await readJson(
        await fetch(`/api/clients/${clientId}/portal/updates/${u.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isPublished: !u.isPublished }),
        }),
      );
      toast.success(!u.isPublished ? "Update published" : "Update hidden from client");
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not change visibility");
    }
  };

  const remove = async (u: AdminClientUpdate) => {
    if (!window.confirm(`Remove "${u.title}"? The client will no longer see it.`)) return;
    try {
      await readJson(await fetch(`/api/clients/${clientId}/portal/updates/${u.id}`, { method: "DELETE" }));
      toast.success("Update removed");
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not remove update");
    }
  };

  return (
    <div className="space-y-4">
      <UpdateComposer clientId={clientId} onCreated={() => void load()} />
      {loading && !data ? (
        <p className="text-sm text-muted-foreground">Loading updates…</p>
      ) : !data || data.items.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          No updates yet. Publish the first one above.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {data.items.map((u) => (
            <li key={u.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{u.title}</span>
                  <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-semibold">
                    {PORTAL_UPDATE_CATEGORY_LABEL[u.category]}
                  </span>
                  <span
                    className={cn(
                      "rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
                      u.isPublished
                        ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300"
                        : "bg-amber-500/14 text-amber-800 dark:text-amber-300",
                    )}
                  >
                    {u.isPublished ? "Visible to client" : "Internal draft"}
                  </span>
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{u.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {u.postedByName} · {formatDateTime(u.publishedAt)} · read by {u.readCount}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="outline" size="sm" onClick={() => void toggle(u)}>
                  {u.isPublished ? <EyeOff className="mr-1.5 h-3.5 w-3.5" /> : <Eye className="mr-1.5 h-3.5 w-3.5" />}
                  {u.isPublished ? "Hide" : "Publish"}
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => void remove(u)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Events ──────────────────────────────────────────────────────────────────

function EventsPanel({ clientId }: { clientId: string }) {
  const [visibility, setVisibility] = useState<"ALL" | "CLIENT_VISIBLE" | "INTERNAL">("ALL");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paginated<StaffEvent> | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/clients/${clientId}/portal/events?visibility=${visibility}&page=${page}&pageSize=25`, {
      cache: "no-store",
    })
      .then((res) => readJson<Paginated<StaffEvent>>(res))
      .then((d) => setData(d))
      .catch((e) => toast.error(e instanceof Error ? e.message : "Could not load events"))
      .finally(() => setLoading(false));
  }, [clientId, visibility, page]);

  useEffect(() => {
    load();
  }, [load]);

  const setEventVisibility = async (ev: StaffEvent, next: StaffEvent["visibility"]) => {
    try {
      await readJson(
        await fetch(`/api/clients/${clientId}/portal/events/${ev.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visibility: next }),
        }),
      );
      setData((prev) =>
        prev ? { ...prev, items: prev.items.map((x) => (x.id === ev.id ? { ...x, visibility: next } : x)) } : prev,
      );
      toast.success(next === "CLIENT_VISIBLE" ? "Now visible to client" : "Hidden from client");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not change visibility");
    }
  };

  const sync = async () => {
    setSyncing(true);
    try {
      const r = await readJson<{ scanned: number; created: number; alreadyMapped: number }>(
        await fetch(`/api/clients/${clientId}/portal/events/backfill`, { method: "POST" }),
      );
      toast.success(`History synced: ${r.created} new event(s) from ${r.scanned} activity rows`);
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1 rounded-lg border bg-muted/40 p-1">
          {(["ALL", "CLIENT_VISIBLE", "INTERNAL"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => {
                setVisibility(v);
                setPage(1);
              }}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                visibility === v ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {v === "ALL" ? "All" : v === "CLIENT_VISIBLE" ? "Visible to client" : "Internal only"}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={() => void sync()} disabled={syncing}>
          {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Sync review history
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Review-workflow activity is mapped here automatically with a default visibility. Toggle any
        row to control exactly what the client sees in their change log and dashboard.
      </p>
      {loading && !data ? (
        <p className="text-sm text-muted-foreground">Loading events…</p>
      ) : !data || data.items.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          No events yet. Use “Sync review history” to map existing activity.
        </p>
      ) : (
        <>
          <ul className="divide-y rounded-lg border">
            {data.items.map((ev) => (
              <li key={ev.id} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <ActivityIcon action={ev.action} category={ev.category} size="sm" />
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-medium">{ev.title}</span>
                      <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-semibold">
                        {PORTAL_CATEGORY_LABEL[ev.category]}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">{ev.description}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="tabular-nums">{formatDateTime(ev.occurredAt)}</span>
                      <span>·</span>
                      <span>{ev.actorName ?? "System"}</span>
                      <RoleBadge role={ev.actorRole} />
                    </p>
                  </div>
                </div>
                <label className="flex shrink-0 items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={ev.visibility === "CLIENT_VISIBLE"}
                    onChange={(e) => void setEventVisibility(ev, e.target.checked ? "CLIENT_VISIBLE" : "INTERNAL")}
                    className="h-4 w-4 rounded border-input accent-[hsl(var(--primary))]"
                  />
                  Visible to client
                </label>
              </li>
            ))}
          </ul>
          {data.totalPages > 1 ? (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Page {data.page} of {data.totalPages} · {data.total} events
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

// ─── Logins ──────────────────────────────────────────────────────────────────

function LoginsPanel({ clientId }: { clientId: string }) {
  const [users, setUsers] = useState<ClientLogin[] | null>(null);
  useEffect(() => {
    fetch(`/api/clients/${clientId}/portal/users`, { cache: "no-store" })
      .then((res) => readJson<ClientLogin[]>(res))
      .then((list) => setUsers(list))
      .catch((e) => {
        toast.error(e instanceof Error ? e.message : "Could not load client logins");
        setUsers([]);
      });
  }, [clientId]);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Client logins are created in <a href="/dashboard/admin/users">Admin → Users</a> with the
        role <code>CLIENT</code>, or with <code>pnpm create:client-user</code>. Passwords are only
        ever stored as bcrypt hashes.
      </p>
      {users === null ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : users.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          No client logins linked to this client yet.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {users.map((u) => (
            <li key={u.id} className="flex items-center justify-between gap-3 p-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium">{u.name}</p>
                <p className="truncate text-xs text-muted-foreground">{u.email}</p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold",
                  u.isActive
                    ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {u.isActive ? "Active" : "Inactive"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function ClientPortalAdmin({ clientId }: { clientId: string }) {
  const router = useRouter();
  return (
    <Tabs defaultValue="updates" className="space-y-4">
      <TabsList>
        <TabsTrigger value="updates">
          <Megaphone className="mr-2 h-4 w-4" />
          Updates
        </TabsTrigger>
        <TabsTrigger value="events">
          <History className="mr-2 h-4 w-4" />
          Change log &amp; visibility
        </TabsTrigger>
        <TabsTrigger value="logins">
          <Users className="mr-2 h-4 w-4" />
          Client logins
        </TabsTrigger>
      </TabsList>
      <TabsContent value="updates">
        <UpdatesPanel clientId={clientId} />
      </TabsContent>
      <TabsContent value="events">
        <EventsPanel clientId={clientId} />
      </TabsContent>
      <TabsContent value="logins">
        <LoginsPanel clientId={clientId} />
        <Button variant="link" className="mt-2 px-0" onClick={() => router.push("/dashboard/admin/users")}>
          <ExternalLink className="mr-1.5 h-4 w-4" />
          Manage users
        </Button>
      </TabsContent>
    </Tabs>
  );
}
