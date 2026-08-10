"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  PERMISSION_DEFINITIONS,
  PERMISSION_LIST,
  type PermissionCategory,
} from "@/lib/team/permissions";

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
  const [description, setDescription] = useState(
    initialData?.description ?? "",
  );
  const [permissions, setPermissions] = useState<Set<string>>(
    new Set(initialData?.permissions ?? []),
  );
  const [permQuery, setPermQuery] = useState("");
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

  function selectAllVisible() {
    const q = permQuery.trim().toLowerCase();
    const visible = PERMISSION_DEFINITIONS.filter((d) => {
      if (!q) return true;
      return (
        d.key.toLowerCase().includes(q) ||
        d.label.toLowerCase().includes(q) ||
        (d.description ?? "").toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q)
      );
    }).map((d) => d.key);

    setPermissions((prev) => {
      const next = new Set(prev);
      for (const k of visible) next.add(k);
      return next;
    });
  }

  function clearAll() {
    setPermissions(new Set());
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const url = roleId ? `/api/team/roles/${roleId}` : `/api/team/roles`;
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

  const q = permQuery.trim().toLowerCase();
  const filteredDefs = PERMISSION_DEFINITIONS.filter((d) => {
    if (!q) return true;
    return (
      d.key.toLowerCase().includes(q) ||
      d.label.toLowerCase().includes(q) ||
      (d.description ?? "").toLowerCase().includes(q) ||
      d.category.toLowerCase().includes(q)
    );
  });

  const defsByCategory = filteredDefs.reduce(
    (acc, d) => {
      (acc[d.category] ||= []).push(d);
      return acc;
    },
    {} as Record<PermissionCategory, typeof PERMISSION_DEFINITIONS>,
  );

  const categoryOrder: PermissionCategory[] = [
    "Settings",
    "Team & Access",
    "Clients",
    "Campaigns",
    "Content & SEO",
    "Leads",
    "Tasks",
    "Reviews",
    "Analytics",
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 px-4 py-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
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
        <div className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Input
              value={permQuery}
              onChange={(e) => setPermQuery(e.target.value)}
              placeholder="Search permissions…"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={selectAllVisible}
              >
                Select visible
              </Button>
              <Button type="button" variant="outline" onClick={clearAll}>
                Clear
              </Button>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            Selected: {permissions.size} / {PERMISSION_LIST.length}
          </div>

          {filteredDefs.length === 0 ? (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              No permissions match “{permQuery}”.
            </div>
          ) : (
            <div className="space-y-4">
              {categoryOrder
                .filter((c) => (defsByCategory[c] ?? []).length > 0)
                .map((category) => (
                  <div key={category} className="space-y-2">
                    <div className="text-sm font-medium">{category}</div>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {(defsByCategory[category] ?? []).map((d) => (
                        <label
                          key={d.key}
                          className="flex cursor-pointer gap-3 rounded border p-3 hover:bg-muted/50"
                        >
                          <input
                            type="checkbox"
                            checked={permissions.has(d.key)}
                            onChange={() => togglePerm(d.key)}
                            className="mt-0.5 h-4 w-4"
                          />
                          <span className="min-w-0">
                            <span className="block text-sm font-medium">
                              {d.label}
                            </span>
                            {d.description ? (
                              <span className="block text-xs text-muted-foreground">
                                {d.description}
                              </span>
                            ) : null}
                            <span className="mt-1 block text-[11px] text-muted-foreground">
                              {d.key}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
