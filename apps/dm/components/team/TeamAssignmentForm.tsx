"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const TYPES = ["review", "lead", "task", "campaign", "client", "other"];
const SOURCES = ["reviews", "leads", "tasks", "campaigns", "clients"];
const STATUSES = ["Pending", "In Progress", "Completed", "Cancelled"];
const PRIORITIES = ["Low", "Medium", "High", "Urgent"];

interface TeamAssignmentFormProps {
  assignmentId?: string;
  initialData?: {
    title: string;
    description?: string;
    assignmentType: string;
    sourceModule?: string;
    referenceId?: string;
    assignedToUserId: string;
    assignedByUserId: string;
    status: string;
    priority: string;
    dueDate?: string;
    notes?: string;
  };
  members: { _id: string; name: string }[];
}

export function TeamAssignmentForm({
  assignmentId,
  initialData,
  members,
}: TeamAssignmentFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [assignmentType, setAssignmentType] = useState(
    initialData?.assignmentType ?? "task"
  );
  const [sourceModule, setSourceModule] = useState(
    initialData?.sourceModule ?? ""
  );
  const [referenceId, setReferenceId] = useState(initialData?.referenceId ?? "");
  const [assignedToUserId, setAssignedToUserId] = useState(
    initialData?.assignedToUserId ?? members[0]?._id ?? ""
  );
  const [assignedByUserId, setAssignedByUserId] = useState(
    initialData?.assignedByUserId ?? members[0]?._id ?? ""
  );
  const [status, setStatus] = useState(initialData?.status ?? "Pending");
  const [priority, setPriority] = useState(initialData?.priority ?? "Medium");
  const [dueDate, setDueDate] = useState(initialData?.dueDate ?? "");
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const assignee = members.find((m) => m._id === assignedToUserId);
    const assigner = members.find((m) => m._id === assignedByUserId);
    try {
      const url = assignmentId
        ? `${BASE}/api/team/assignments/${assignmentId}`
        : `${BASE}/api/team/assignments`;
      const method = assignmentId ? "PATCH" : "POST";
      const body = {
        title,
        description: description || undefined,
        assignmentType,
        sourceModule: sourceModule || undefined,
        referenceId: referenceId || undefined,
        assignedToUserId,
        assignedToUserName: assignee?.name ?? "",
        assignedByUserId,
        assignedByUserName: assigner?.name ?? "",
        status,
        priority,
        dueDate: dueDate || undefined,
        notes: notes || undefined,
      };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      router.push("/team/assignments");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 px-4 py-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-muted-foreground">
          Title *
        </label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-muted-foreground">
          Description
        </label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-muted-foreground">
            Type
          </label>
          <select
            value={assignmentType}
            onChange={(e) => setAssignmentType(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-muted-foreground">
            Source Module
          </label>
          <select
            value={sourceModule}
            onChange={(e) => setSourceModule(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
          >
            <option value="">—</option>
            {SOURCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-muted-foreground">
          Reference ID
        </label>
        <Input
          value={referenceId}
          onChange={(e) => setReferenceId(e.target.value)}
          placeholder="e.g. draft ID, task ID"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-muted-foreground">
            Assigned To *
          </label>
          <select
            value={assignedToUserId}
            onChange={(e) => setAssignedToUserId(e.target.value)}
            required
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
          >
            {members.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-muted-foreground">
            Assigned By *
          </label>
          <select
            value={assignedByUserId}
            onChange={(e) => setAssignedByUserId(e.target.value)}
            required
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
          >
            {members.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-muted-foreground">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-muted-foreground">
            Priority
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-muted-foreground">
          Due Date
        </label>
        <Input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-muted-foreground">
          Notes
        </label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
