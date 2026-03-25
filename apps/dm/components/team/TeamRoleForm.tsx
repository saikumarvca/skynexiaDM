"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PERMISSION_LIST } from "@/lib/team/permissions";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3152";

interface TeamRoleFormProps {
  roleId?: string;
  initialData?: {
    roleName: string;
    description?: string;
    permissions: string[];
  };
}

export function TeamRoleForm({ roleId, initialData }: TeamRoleFormProps) {
  const router = useRouter();
  const [roleName, setRoleName] = useState(initialData?.roleName ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [permissions, setPermissions] = useState<Set<string>>(
    new Set(initialData?.permissions ?? [])
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function togglePerm(perm: string) {
    setPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(perm)) next.delete(perm);
      else next.add(perm);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const url = roleId
        ? `${BASE}/api/team/roles/${roleId}`
        : `${BASE}/api/team/roles`;
      const method = roleId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleName,
          description: description || undefined,
          permissions: Array.from(permissions),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      router.push("/team/roles");
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
          Role Name *
        </label>
        <Input
          value={roleName}
          onChange={(e) => setRoleName(e.target.value)}
          required
          disabled={!!roleId}
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
      <div>
        <label className="mb-2 block text-sm font-medium text-muted-foreground">
          Permissions
        </label>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {PERMISSION_LIST.map((perm) => (
            <label
              key={perm}
              className="flex cursor-pointer items-center gap-2 rounded p-2 hover:bg-muted/50"
            >
              <input
                type="checkbox"
                checked={permissions.has(perm)}
                onChange={() => togglePerm(perm)}
                className="h-4 w-4"
              />
              <span className="text-sm">
                {perm.replace(/_/g, " ")}
              </span>
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
