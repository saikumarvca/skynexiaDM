"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Copy,
  Loader2,
  MessageCircle,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PROPOSED_CONTACT_BOOK_TAGS,
  normalizeContactTags,
  proposedTagSetLower,
} from "@/lib/contact-book-tags";
import { buildWhatsAppUrl, parseWhatsAppDigits } from "@/lib/whatsapp-url";
import { cn } from "@/lib/utils";

export type ContactBookRow = {
  _id: string;
  ownerUserId: string;
  ownerName?: string;
  ownerEmail?: string;
  displayName: string;
  phone?: string;
  email?: string;
  notes?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

type TeamUserOption = { _id: string; name: string; email: string };

type TagMatchMode = "any" | "all";

const emptyForm = {
  displayName: "",
  phone: "",
  email: "",
  notes: "",
  tags: [] as string[],
};

export function ContactBookManager({
  isAdmin = false,
}: {
  isAdmin?: boolean;
}) {
  const [entries, setEntries] = useState<ContactBookRow[]>([]);
  const [teamUsers, setTeamUsers] = useState<TeamUserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [ownerUserId, setOwnerUserId] = useState("");
  const [filterTagKeys, setFilterTagKeys] = useState<string[]>([]);
  const [tagMatchMode, setTagMatchMode] = useState<TagMatchMode>("any");
  const [groupBy, setGroupBy] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ContactBookRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);

  const proposedLower = useMemo(() => proposedTagSetLower(), []);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 320);
    return () => window.clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/users");
        if (!res.ok) return;
        const data = (await res.json()) as TeamUserOption[];
        if (!cancelled) setTeamUsers(data);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (debouncedSearch) q.set("search", debouncedSearch);
      if (isAdmin && ownerUserId) q.set("ownerUserId", ownerUserId);
      const res = await fetch(`/api/contact-book?${q.toString()}`);
      if (!res.ok) {
        setError("Could not load contact book");
        return;
      }
      const data = (await res.json()) as ContactBookRow[];
      setEntries(data);
    } catch {
      setError("Could not load contact book");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, isAdmin, ownerUserId]);

  useEffect(() => {
    void load();
  }, [load]);

  const allFilterTags = useMemo(() => {
    const set = new Set<string>();
    for (const e of entries) {
      for (const t of e.tags ?? []) {
        if (t) set.add(t);
      }
    }
    for (const t of PROPOSED_CONTACT_BOOK_TAGS) set.add(t);
    return [...set].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  }, [entries]);

  const filtered = useMemo(() => {
    if (filterTagKeys.length === 0) return entries;
    const want = new Set(filterTagKeys.map((t) => t.toLowerCase()));
    return entries.filter((e) =>
      (e.tags ?? []).some((t) => want.has(t.toLowerCase())),
    );
  }, [entries, filterTagKeys]);

  const toggleFilterTag = (tag: string) => {
    setFilterTagKeys((prev) => {
      const lower = tag.toLowerCase();
      const has = prev.some((t) => t.toLowerCase() === lower);
      if (has) return prev.filter((t) => t.toLowerCase() !== lower);
      return [...prev, tag];
    });
  };

  const groupSections = useMemo(() => {
    if (!groupBy) return null;
    const untagged: ContactBookRow[] = [];
    const byProposed: { tag: string; rows: ContactBookRow[] }[] =
      PROPOSED_CONTACT_BOOK_TAGS.map((tag) => ({ tag, rows: [] }));
    const other: ContactBookRow[] = [];

    for (const e of filtered) {
      const tags = e.tags ?? [];
      if (tags.length === 0) {
        untagged.push(e);
        continue;
      }
      for (const row of byProposed) {
        if (
          tags.some((t) => t.toLowerCase() === row.tag.toLowerCase())
        ) {
          row.rows.push(e);
        }
      }
      const onlyCustom =
        tags.length > 0 &&
        tags.every((t) => !proposedLower.has(t.toLowerCase()));
      if (onlyCustom) {
        other.push(e);
      }
    }

    return { untagged, byProposed, other };
  }, [filtered, groupBy, proposedLower]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setTagInput("");
    setFormOpen(true);
  }

  function openEdit(row: ContactBookRow) {
    setEditing(row);
    setForm({
      displayName: row.displayName,
      phone: row.phone ?? "",
      email: row.email ?? "",
      notes: row.notes ?? "",
      tags: [...(row.tags ?? [])],
    });
    setTagInput("");
    setFormOpen(true);
  }

  function toggleFormTag(tag: string) {
    const lower = tag.toLowerCase();
    setForm((f) => {
      const has = f.tags.some((t) => t.toLowerCase() === lower);
      const tags = has
        ? f.tags.filter((t) => t.toLowerCase() !== lower)
        : [...f.tags, tag];
      return { ...f, tags: normalizeContactTags(tags) };
    });
  }

  function addCustomTag() {
    const t = tagInput.trim();
    if (!t) return;
    setForm((f) => ({
      ...f,
      tags: normalizeContactTags([...f.tags, t]),
    }));
    setTagInput("");
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    if (!form.displayName.trim()) return;
    setSaving(true);
    try {
      const tags = normalizeContactTags(form.tags);
      const url = editing
        ? `/api/contact-book/${editing._id}`
        : "/api/contact-book";
      const method = editing ? "PATCH" : "POST";
      const body = editing
        ? {
            displayName: form.displayName.trim(),
            phone: form.phone.trim() || null,
            email: form.email.trim() || null,
            notes: form.notes.trim() || null,
            tags,
          }
        : {
            displayName: form.displayName.trim(),
            phone: form.phone.trim() || undefined,
            email: form.email.trim() || undefined,
            notes: form.notes.trim() || undefined,
            tags,
          };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast.error(
          typeof j.error === "string" ? j.error : "Could not save contact",
        );
        return;
      }
      toast.success(editing ? "Contact updated" : "Contact added");
      setFormOpen(false);
      await load();
    } catch {
      toast.error("Could not save contact");
    } finally {
      setSaving(false);
    }
  }

  async function removeRow(row: ContactBookRow) {
    if (!window.confirm(`Delete “${row.displayName}” from your contact book?`))
      return;
    const res = await fetch(`/api/contact-book/${row._id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      toast.error("Could not delete");
      return;
    }
    toast.success("Contact deleted");
    await load();
  }

  async function copyText(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Could not copy");
    }
  }

  function renderRows(rows: ContactBookRow[]) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead className="hidden lg:table-cell">Notes</TableHead>
            {isAdmin ? <TableHead>Owner</TableHead> : null}
            <TableHead className="w-[1%] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row._id}>
              <TableCell className="font-medium">{row.displayName}</TableCell>
              <TableCell>
                {row.phone ? (
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="break-all">{row.phone}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      title="Copy phone"
                      onClick={() => copyText(row.phone!, "Phone")}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    {parseWhatsAppDigits(row.phone) ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-emerald-600"
                        title="Open WhatsApp"
                        onClick={() => {
                          const d = parseWhatsAppDigits(row.phone!);
                          if (d)
                            window.open(
                              buildWhatsAppUrl(d, ""),
                              "_blank",
                              "noopener,noreferrer",
                            );
                        }}
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                      </Button>
                    ) : null}
                  </div>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell className="break-all max-w-[10rem]">
                {row.email ?? "—"}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {(row.tags ?? []).length === 0 ? (
                    <span className="text-muted-foreground text-sm">—</span>
                  ) : (
                    row.tags.map((t) => (
                      <Badge
                        key={`${row._id}-${t}`}
                        variant="secondary"
                        className="font-normal"
                      >
                        {t}
                      </Badge>
                    ))
                  )}
                </div>
              </TableCell>
              <TableCell className="hidden lg:table-cell max-w-xs truncate text-muted-foreground text-sm">
                {row.notes ?? "—"}
              </TableCell>
              {isAdmin ? (
                <TableCell className="text-sm text-muted-foreground">
                  {row.ownerName ?? row.ownerUserId}
                  {row.ownerEmail ? (
                    <span className="block text-xs">{row.ownerEmail}</span>
                  ) : null}
                </TableCell>
              ) : null}
              <TableCell className="text-right whitespace-nowrap">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  title="Edit"
                  onClick={() => openEdit(row)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  title="Delete"
                  onClick={() => removeRow(row)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Contact book</h1>
        <p className="text-muted-foreground">
          Save people you reach on WhatsApp or other channels.{" "}
          {isAdmin
            ? "As an admin you can view every user’s entries."
            : "Admins in your workspace can view all entries."}
        </p>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
        <div className="min-w-0 flex-1 sm:max-w-sm">
          <label className="text-sm font-medium">Search</label>
          <Input
            className="mt-1"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, phone, email…"
          />
        </div>
        {isAdmin ? (
          <div className="w-full sm:w-56">
            <label className="text-sm font-medium">Owner</label>
            <select
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              value={ownerUserId}
              onChange={(e) => setOwnerUserId(e.target.value)}
            >
              <option value="">All users</option>
              {teamUsers.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={groupBy}
            onChange={(e) => setGroupBy(e.target.checked)}
            className="rounded border-input"
          />
          Group by tag
        </label>
        <Button type="button" size="sm" onClick={openCreate} className="w-fit">
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add contact
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <p className="text-sm font-medium">Filter by tag</p>
          {filterTagKeys.length > 0 ? (
            <label className="flex w-full max-w-xs items-center gap-2 text-sm text-muted-foreground sm:w-auto">
              <span className="shrink-0">Match</span>
              <select
                className="flex h-8 min-w-0 flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm"
                value={tagMatchMode}
                onChange={(e) =>
                  setTagMatchMode(e.target.value === "all" ? "all" : "any")
                }
                aria-label="Tag filter match mode"
              >
                <option value="any">Any selected tag</option>
                <option value="all">All selected tags</option>
              </select>
            </label>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {allFilterTags.map((t) => {
            const active = filterTagKeys.some(
              (x) => x.toLowerCase() === t.toLowerCase(),
            );
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggleFilterTag(t)}
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/60",
                )}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm py-8">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading…
        </div>
      ) : groupBy && groupSections ? (
        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-semibold mb-2 border-b pb-1">
              Untagged
            </h2>
            {groupSections.untagged.length === 0 ? (
              <p className="text-sm text-muted-foreground">No contacts.</p>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                {renderRows(groupSections.untagged)}
              </div>
            )}
          </section>
          {groupSections.byProposed.map(({ tag, rows }) => (
            <section key={tag}>
              <h2 className="text-lg font-semibold mb-2 border-b pb-1">
                {tag}
              </h2>
              {rows.length === 0 ? (
                <p className="text-sm text-muted-foreground">No contacts.</p>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  {renderRows(rows)}
                </div>
              )}
            </section>
          ))}
          <section>
            <h2 className="text-lg font-semibold mb-2 border-b pb-1">
              Other tags
            </h2>
            <p className="text-xs text-muted-foreground mb-2">
              Contacts that only use tags outside the suggested list.
            </p>
            {groupSections.other.length === 0 ? (
              <p className="text-sm text-muted-foreground">No contacts.</p>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                {renderRows(groupSections.other)}
              </div>
            )}
          </section>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8">
          No contacts yet. Add one or adjust filters.
        </p>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          {renderRows(filtered)}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit contact" : "New contact"}
            </DialogTitle>
            <DialogDescription>
              Suggested tags help group outreach. You can add your own tags
              too.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitForm} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name *</label>
              <Input
                className="mt-1"
                value={form.displayName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, displayName: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Phone</label>
              <Input
                className="mt-1"
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
                placeholder="WhatsApp / international format"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                className="mt-1"
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">Tags</label>
              <p className="text-xs text-muted-foreground mt-0.5 mb-2">
                Click a suggestion or type a custom tag and press Add.
              </p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {PROPOSED_CONTACT_BOOK_TAGS.map((tag) => {
                  const on = form.tags.some(
                    (t) => t.toLowerCase() === tag.toLowerCase(),
                  );
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleFormTag(tag)}
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
                        on
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border bg-background hover:bg-muted/60",
                      )}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Custom tag"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomTag();
                    }
                  }}
                />
                <Button type="button" variant="secondary" onClick={addCustomTag}>
                  Add
                </Button>
              </div>
              {form.tags.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-2">
                  {form.tags.map((t) => (
                    <Badge
                      key={t}
                      variant="outline"
                      className="cursor-pointer font-normal"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          tags: f.tags.filter((x) => x !== t),
                        }))
                      }
                      title="Click to remove"
                    >
                      {t} ×
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                className="mt-1 resize-none"
                rows={3}
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : editing ? "Save" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
