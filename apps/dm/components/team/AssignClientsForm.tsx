"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface AssignClientsFormProps {
  memberId: string;
  memberName: string;
  initialClientIds: string[];
  clients: { _id: string; name?: string; businessName?: string }[];
}

export function AssignClientsForm({
  memberId,
  initialClientIds,
  clients,
}: AssignClientsFormProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set(initialClientIds));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/team/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignedClientIds: Array.from(selected),
          assignedClientNamesSnapshot: clients
            .filter((c) => selected.has(c._id))
            .map((c) => c.businessName ?? c.name ?? ""),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");
      router.push("/team/members");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
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
      <div className="max-h-96 overflow-y-auto rounded-md border p-4">
        <p className="mb-3 text-sm text-muted-foreground">
          Select clients to assign. {selected.size} selected.
        </p>
        <div className="space-y-2">
          {clients.map((c) => (
            <label
              key={c._id}
              className="flex cursor-pointer items-center gap-2 rounded p-2 hover:bg-muted/50"
            >
              <input
                type="checkbox"
                checked={selected.has(c._id)}
                onChange={() => toggle(c._id)}
                className="h-4 w-4"
              />
              <span>{c.businessName ?? c.name ?? c._id}</span>
            </label>
          ))}
        </div>
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
