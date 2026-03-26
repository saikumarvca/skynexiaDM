"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ReviewDraftForm } from "./review-draft-form";
import { AssignDraftModal } from "./assign-draft-modal";
import { ReviewActivityTimeline } from "./review-activity-timeline";
import { ReviewDraftDetailsPane } from "./review-draft-details-pane";
import type { ReviewDraft, ReviewDraftFormData, AssignDraftFormData } from "@/types/reviews";
import type { Client } from "@/types";
import { cn } from "@/lib/utils";
import { LayoutGrid, Rows3 } from "lucide-react";

interface User {
  _id: string;
  name: string;
}

interface ReviewDraftTableProps {
  drafts: ReviewDraft[];
  clients: Client[];
  users: User[];
  selectedClientId?: string;
  onCreate: (data: ReviewDraftFormData) => Promise<void>;
  onUpdate: (id: string, data: Partial<ReviewDraftFormData>) => Promise<void>;
  onDuplicate: (id: string) => Promise<void>;
  onAssign: (id: string, data: AssignDraftFormData) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
}

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3152";

function truncate(s: string, len: number) {
  if (!s) return "—";
  return s.length <= len ? s : s.slice(0, len) + "…";
}

type AllocationLite = {
  _id: string;
  draftId: string | { _id?: string };
  assignedToUserName?: string;
  createdAt?: string;
};

export function ReviewDraftTable({
  drafts,
  clients,
  users,
  selectedClientId,
  onCreate,
  onUpdate,
  onDuplicate,
  onAssign,
  onArchive,
}: ReviewDraftTableProps) {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"row" | "grid">("row");
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const selectedDraft = drafts.find((d) => d._id === selectedDraftId) ?? null;
  const [formOpen, setFormOpen] = useState(false);
  const [editDraft, setEditDraft] = useState<ReviewDraft | null>(null);
  const [assignDraft, setAssignDraft] = useState<ReviewDraft | null>(null);
  const [activityDraft, setActivityDraft] = useState<ReviewDraft | null>(null);
  const [activity, setActivity] = useState<{ action: string; performedBy: string; performedAt: string }[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cardRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const paneRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const [allocationsByDraftId, setAllocationsByDraftId] = useState<Record<string, string>>({});
  const [paneOpen, setPaneOpen] = useState(false);
  const [paneTop, setPaneTop] = useState<number>(96);

  const draftIds = useMemo(() => drafts.map((d) => d._id), [drafts]);

  useEffect(() => {
    let cancelled = false;
    async function loadAllocations() {
      try {
        if (draftIds.length === 0) {
          if (!cancelled) setAllocationsByDraftId({});
          return;
        }
        const url = new URL(`${BASE}/api/review-allocations`);
        url.searchParams.set("draftIds", draftIds.join(","));
        const res = await fetch(url.toString(), { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load allocations");
        const list = (await res.json()) as AllocationLite[];
        const map: Record<string, string> = {};
        for (const a of list) {
          const id =
            typeof a.draftId === "string"
              ? a.draftId
              : (a.draftId?._id ?? "");
          if (!id) continue;
          // API sorts by createdAt desc, so first hit per draft is latest.
          if (map[id]) continue;
          if (a.assignedToUserName) map[id] = a.assignedToUserName;
        }
        if (!cancelled) setAllocationsByDraftId(map);
      } catch (e) {
        console.error(e);
        if (!cancelled) setAllocationsByDraftId({});
      }
    }
    loadAllocations();
    return () => {
      cancelled = true;
    };
  }, [draftIds]);

  const parseCSV = (text: string): { subject: string; reviewText: string; category?: string; language?: string; suggestedRating?: string }[] => {
    const parseRow = (line: string): string[] => {
      const out: string[] = [];
      let cur = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') inQuotes = !inQuotes;
        else if (c === "," && !inQuotes) {
          out.push(cur.replace(/^"|"$/g, "").trim());
          cur = "";
        } else cur += c;
      }
      out.push(cur.replace(/^"|"$/g, "").trim());
      return out;
    };
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return [];
    const headers = parseRow(lines[0]!).map((h) => h.toLowerCase().replace(/\s+/g, " "));
    const rows: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      const vals = parseRow(line);
      const row: Record<string, string> = {};
      headers.forEach((h, j) => { row[h] = vals[j] ?? ""; });
      rows.push(row);
    }
    return rows
      .map((r) => ({
        subject: (r.subject ?? "").trim(),
        reviewText: (r.reviewtext ?? r["review text"] ?? "").trim(),
        category: (r.category ?? "").trim() || undefined,
        language: (r.language ?? "").trim() || undefined,
        suggestedRating: (r.suggestedrating ?? r.rating ?? r["suggested rating"] ?? "").trim() || undefined,
      }))
      .filter((d) => d.subject || d.reviewText);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportLoading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const text = String(reader.result ?? "");
        const parsed = parseCSV(text);
        if (parsed.length === 0) {
          alert("No valid rows found. CSV should have columns: subject, reviewText (or review text), and optionally category, language, suggestedRating.");
          return;
        }
        const res = await fetch(`${BASE}/api/review-drafts/import`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            drafts: parsed,
            clientId: selectedClientId && selectedClientId !== "ALL" ? selectedClientId : undefined,
            createdBy: "system",
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Import failed");
        router.refresh();
        e.target.value = "";
      } catch (err) {
        console.error(err);
        alert("Import failed. Ensure CSV has subject and reviewText columns, and at least one active client exists.");
      } finally {
        setImportLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const wrapRefresh = <T,>(fn: (...args: T[]) => Promise<unknown>) => async (...args: T[]) => {
    await fn(...args);
    router.refresh();
  };

  const filtered = drafts.filter((d) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (d.subject ?? "").toLowerCase().includes(s) ||
      (d.reviewText ?? "").toLowerCase().includes(s) ||
      (d.clientName ?? "").toLowerCase().includes(s) ||
      (d.category ?? "").toLowerCase().includes(s)
    );
  });

  const clientName = (d: ReviewDraft) => {
    const c = d.clientId;
    if (typeof c === "object" && c && "businessName" in c) return (c as { businessName?: string }).businessName ?? "—";
    return d.clientName ?? "—";
  };

  const handleCopy = async (d: ReviewDraft) => {
    try {
      await navigator.clipboard.writeText(d.reviewText);
    } catch (e) {
      console.error(e);
    }
  };

  const handleFetchActivity = async (entityType: string, entityId: string) => {
    const res = await fetch(`${BASE}/api/review-activity?entityType=${entityType}&entityId=${entityId}`);
    return res.json();
  };

  const openActivity = async (d: ReviewDraft) => {
    setActivityDraft(d);
    const logs = await handleFetchActivity("DRAFT", d._id);
    setActivity(logs);
  };

  const computePaneTop = (draftId: string) => {
    const el = cardRefs.current[draftId];
    if (!el) return;
    const cardRect = el.getBoundingClientRect();
    const paneHeight = paneRef.current?.getBoundingClientRect().height ?? 520;
    const minTop = 80; // keep below header
    const maxTop = Math.max(minTop, window.innerHeight - paneHeight - 24);
    const desired = cardRect.top;
    const clamped = Math.max(minTop, Math.min(desired, maxTop));
    setPaneTop(clamped);
  };

  const handleRowClick = (d: ReviewDraft) => {
    setSelectedDraftId(d._id);
    setPaneOpen(true);
    requestAnimationFrame(() => computePaneTop(d._id));
  };

  useEffect(() => {
    if (!paneOpen || !selectedDraftId) return;
    const onScrollOrResize = () => computePaneTop(selectedDraftId);
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [paneOpen, selectedDraftId]);

  const handleArchiveClick = (d: ReviewDraft) => {
    if (confirm("Archive this draft?")) wrapRefresh(onArchive)(d._id);
  };

  const renderDraftCard = (d: ReviewDraft, mode: "row" | "grid") => {
    const selected = selectedDraftId === d._id;
    const assignedToName = allocationsByDraftId[d._id];

    return (
      <button
        key={d._id}
        type="button"
        onClick={() => handleRowClick(d)}
        ref={(el) => {
          cardRefs.current[d._id] = el;
        }}
        className={cn(
          "group text-left rounded-lg border bg-card text-card-foreground shadow-md/40 transition-all hover:shadow-lg/35 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background",
          mode === "grid"
            ? "p-4 hover:-translate-y-0.5 flex flex-col"
            : "p-4 md:p-5 flex flex-col gap-3 md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_minmax(0,2fr)] md:items-start",
          selected && "border-primary/50 ring-2 ring-ring"
        )}
        aria-label={`Open details for ${d.subject}`}
      >
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold leading-snug truncate group-hover:text-foreground" title={d.subject}>
                {d.subject}
              </p>
              <p className="mt-1 text-xs text-muted-foreground truncate" title={clientName(d)}>
                {clientName(d)}
              </p>
            </div>
            <span className="shrink-0 inline-flex rounded-full border bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {d.language || "—"}
            </span>
          </div>

          {mode === "grid" && (
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
              {d.category ? (
                <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                  {d.category}
                </span>
              ) : (
                <span className="text-muted-foreground">No category</span>
              )}
              <span className="ml-auto inline-flex rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
                {d.status}
              </span>
            </div>
          )}
        </div>

        <p
          className={cn(
            "text-sm text-muted-foreground",
            mode === "grid" ? "mt-3" : "md:mt-0"
          )}
          title={d.reviewText}
        >
          {truncate(d.reviewText, mode === "grid" ? 110 : 220)}
        </p>

        {mode === "row" && (
          <div className="flex flex-wrap items-center gap-2 text-xs md:justify-end md:self-center">
            {d.category ? (
              <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                {d.category}
              </span>
            ) : (
              <span className="text-muted-foreground">No category</span>
            )}
            <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
              {d.status}
            </span>
            <span className="text-muted-foreground">Assigned to</span>
            {assignedToName ? (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary ring-1 ring-primary/20">
                {assignedToName}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground ring-1 ring-border">
                Unassigned
              </span>
            )}
          </div>
        )}

        {mode === "grid" && (
          <div className="mt-4 pt-3 border-t flex items-center gap-2 text-xs text-muted-foreground">
            <span>Assigned to</span>
            {assignedToName ? (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary ring-1 ring-primary/20">
                {assignedToName}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground ring-1 ring-border">
                Unassigned
              </span>
            )}
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="min-w-0">
        <div className="mb-4 flex flex-wrap gap-4">
          <Input
            placeholder="Search subject, text, client, category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <div className="inline-flex rounded-md border bg-background p-1">
            <Button
              type="button"
              variant={viewMode === "row" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 px-2"
              onClick={() => setViewMode("row")}
            >
              <Rows3 className="mr-1 h-4 w-4" />
              Row
            </Button>
            <Button
              type="button"
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 px-2"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="mr-1 h-4 w-4" />
              Grid
            </Button>
          </div>
          <Button onClick={() => { setEditDraft(null); setFormOpen(true); }}>
            Create Draft
          </Button>
          <Button variant="outline" onClick={() => window.open(`${BASE}/api/review-drafts/export`, "_blank")}>
            Export CSV
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleImportFile}
          />
          <Button
            variant="outline"
            disabled={importLoading}
            onClick={() => fileInputRef.current?.click()}
          >
            {importLoading ? "Importing…" : "Import"}
          </Button>
          <details className="relative">
            <summary className="inline-flex h-10 cursor-pointer items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              Import format
            </summary>
            <div
              role="tooltip"
              aria-label="CSV import format help"
              className="absolute left-0 top-[calc(100%+0.5rem)] z-20 w-[340px] max-w-[calc(100vw-2rem)] rounded-md border bg-popover p-3 text-sm text-popover-foreground shadow-md"
            >
              <p className="font-medium">CSV format</p>
              <p className="mt-2">
                Required: <code>subject</code>, <code>reviewText</code> (or <code>review text</code>)
              </p>
              <p className="mt-1">
                Optional: <code>category</code>, <code>language</code>, <code>suggestedRating</code> (or <code>rating</code>, <code>suggested rating</code>)
              </p>
              <p className="mt-2 text-xs text-muted-foreground">Example header:</p>
              <p className="mt-1 text-xs text-muted-foreground break-words">
                subject,reviewText,category,language,suggestedRating
              </p>
            </div>
          </details>
        </div>

        {viewMode === "grid" ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((d) => renderDraftCard(d, "grid"))}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((d) => renderDraftCard(d, "row"))}
          </div>
        )}

        {filtered.length === 0 && (
          <p className="py-8 text-center text-muted-foreground">No drafts found.</p>
        )}
      </div>

      {/* Floating details pane aligned to selected card */}
      <div
        ref={paneRef}
        className={cn(
          "hidden lg:block fixed right-6 z-40 w-[420px] max-w-[calc(100vw-2rem)]",
          "rounded-lg border bg-background shadow-xl",
          "transition-transform duration-200 ease-out",
          paneOpen && selectedDraftId ? "translate-x-0" : "translate-x-[460px]"
        )}
        style={{ top: paneTop }}
      >
        <div className="h-[520px] overflow-hidden">
          <ReviewDraftDetailsPane
            draft={selectedDraft}
            clients={clients}
            users={users}
            assignedToName={selectedDraftId ? allocationsByDraftId[selectedDraftId] : undefined}
            onClose={() => { setPaneOpen(false); setSelectedDraftId(null); }}
            onEdit={(draft) => { setEditDraft(draft); setFormOpen(true); }}
            onDuplicate={(id) => wrapRefresh(onDuplicate)(id)}
            onCopy={handleCopy}
            onAssign={(draft) => setAssignDraft(draft)}
            onArchive={handleArchiveClick}
            onViewHistory={openActivity}
          />
        </div>
      </div>

      <ReviewDraftForm
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditDraft(null); }}
        onSubmit={wrapRefresh(editDraft ? (d) => onUpdate(editDraft._id, d) : onCreate)}
        clients={clients}
        draft={editDraft}
      />

      <AssignDraftModal
        isOpen={!!assignDraft}
        onClose={() => setAssignDraft(null)}
        onSubmit={wrapRefresh(async (data) => {
          if (assignDraft) await onAssign(assignDraft._id, data);
        })}
        draft={assignDraft}
        users={users}
        assignedByUserId={users[0]?._id ?? ""}
        assignedByUserName={users[0]?.name ?? "system"}
        isNonReusableUsed={assignDraft ? !assignDraft.reusable && assignDraft.status === "Used" : false}
      />

      <ReviewActivityTimeline
        isOpen={!!activityDraft}
        onClose={() => { setActivityDraft(null); setActivity([]); }}
        activity={activity}
      />
    </div>
  );
}
