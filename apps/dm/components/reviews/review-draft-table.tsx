"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { ReviewDraftForm } from "./review-draft-form";
import { AssignDraftModal } from "./assign-draft-modal";
import { ReviewActivityTimeline } from "./review-activity-timeline";
import type { ReviewDraft, ReviewDraftFormData, AssignDraftFormData } from "@/types/reviews";
import type { Client } from "@/types";

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

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

function truncate(s: string, len: number) {
  if (!s) return "—";
  return s.length <= len ? s : s.slice(0, len) + "…";
}

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
  const [formOpen, setFormOpen] = useState(false);
  const [editDraft, setEditDraft] = useState<ReviewDraft | null>(null);
  const [assignDraft, setAssignDraft] = useState<ReviewDraft | null>(null);
  const [activityDraft, setActivityDraft] = useState<ReviewDraft | null>(null);
  const [activity, setActivity] = useState<{ action: string; performedBy: string; performedAt: string }[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

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
        const drafts = parseCSV(text);
        if (drafts.length === 0) {
          alert("No valid rows found. CSV should have columns: subject, reviewText (or review text), and optionally category, language, suggestedRating.");
          return;
        }
        const res = await fetch(`${BASE}/api/review-drafts/import`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            drafts,
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
    const res = await fetch(
      `${BASE}/api/review-activity?entityType=${entityType}&entityId=${entityId}`
    );
    const data = await res.json();
    return data;
  };

  const openActivity = async (d: ReviewDraft) => {
    setActivityDraft(d);
    const logs = await handleFetchActivity("DRAFT", d._id);
    setActivity(logs);
  };

  return (
    <>
      <div className="mb-4 flex gap-4">
        <Input
          placeholder="Search subject, text, client, category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
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
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>Review Text Preview</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Language</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Reusable</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((d) => (
              <TableRow key={d._id}>
                <TableCell className="font-medium">{d.subject}</TableCell>
                <TableCell className="max-w-[200px] truncate" title={d.reviewText}>
                  {truncate(d.reviewText, 60)}
                </TableCell>
                <TableCell>{clientName(d)}</TableCell>
                <TableCell>{d.category}</TableCell>
                <TableCell>{d.language}</TableCell>
                <TableCell>{d.suggestedRating}</TableCell>
                <TableCell>{d.reusable ? "Yes" : "No"}</TableCell>
                <TableCell>
                  <StatusBadge status={d.status as "Available" | "Allocated" | "Shared" | "Used" | "Archived"} />
                </TableCell>
                <TableCell>{d.createdBy}</TableCell>
                <TableCell>{new Date(d.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => { setEditDraft(d); setFormOpen(true); }}>
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => wrapRefresh(onDuplicate)(d._id)}>
                      Duplicate
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleCopy(d)} title="Copy text">
                      Copy
                    </Button>
                    {d.status !== "Archived" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAssignDraft(d)}
                        disabled={!d.reusable && d.status === "Used"}
                      >
                        Assign
                      </Button>
                    )}
                    {d.status !== "Archived" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          if (confirm("Archive this draft?")) {
                            await wrapRefresh(onArchive)(d._id);
                          }
                        }}
                      >
                        Archive
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => openActivity(d)}>
                      History
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filtered.length === 0 && (
        <p className="text-center py-8 text-muted-foreground">No drafts found.</p>
      )}

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
    </>
  );
}
