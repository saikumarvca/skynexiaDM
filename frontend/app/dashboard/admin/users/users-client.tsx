"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UserCheck, UserX } from "lucide-react";

type UserRow = {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  clientId?: string;
  clientName?: string;
};

type ClientOption = { _id: string; label: string };

const ROLES = [
  "ADMIN",
  "MANAGER",
  "CONTENT_WRITER",
  "DESIGNER",
  "ANALYST",
  "CLIENT",
] as const;

const ROLE_HINTS: Record<(typeof ROLES)[number], string> = {
  ADMIN: "Full access to everything.",
  MANAGER: "Team login; access comes from the team role.",
  CONTENT_WRITER: "Team login; access comes from the team role.",
  DESIGNER: "Team login; access comes from the team role.",
  ANALYST: "Team login; access comes from the team role.",
  CLIENT:
    "External client login: sees only the review progress and statistics for one client.",
};

export function AdminUsersClient({
  initialUsers,
}: {
  initialUsers: UserRow[];
}) {
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<(typeof ROLES)[number]>("MANAGER");
  const [password, setPassword] = useState("");
  const [clientId, setClientId] = useState("");
  const [clients, setClients] = useState<ClientOption[] | null>(null);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(s) ||
        u.email.toLowerCase().includes(s) ||
        u.role.toLowerCase().includes(s) ||
        (u.clientName ?? "").toLowerCase().includes(s),
    );
  }, [users, search]);

  async function loadClients() {
    if (clients !== null || clientsLoading) return;
    setClientsLoading(true);
    try {
      const res = await fetch("/api/clients?limit=500", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load clients");
      const rows = (await res.json()) as {
        _id: string;
        name?: string;
        businessName?: string;
      }[];
      const options = rows
        .map((c) => {
          const n = (c.name ?? "").trim();
          const b = (c.businessName ?? "").trim();
          const label =
            b && b.toLowerCase() !== n.toLowerCase() ? `${n} — ${b}` : n || b;
          return { _id: c._id, label };
        })
        .sort((a, b) => a.label.localeCompare(b.label));
      setClients(options);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load clients");
      setClients([]);
    } finally {
      setClientsLoading(false);
    }
  }

  function onRoleChange(next: (typeof ROLES)[number]) {
    setRole(next);
    if (next === "CLIENT") void loadClients();
  }

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (role === "CLIENT" && !clientId) {
      setError("Select the client this login belongs to.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          role,
          password,
          clientId: role === "CLIENT" ? clientId : undefined,
        }),
      });
      const data = (await res.json()) as { error?: string } & Partial<UserRow>;
      if (!res.ok) throw new Error(data.error || "Failed to create user");
      setUsers((prev) => [
        {
          _id: data._id!,
          name: data.name!,
          email: data.email!,
          role: data.role!,
          isActive: data.isActive ?? true,
          clientId: data.clientId,
          clientName: data.clientName,
        },
        ...prev,
      ]);
      setName("");
      setEmail("");
      setRole("MANAGER");
      setPassword("");
      setClientId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  async function setUserActive(id: string, isActive: boolean) {
    setListError(null);
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      const data = (await res.json()) as { error?: string } & Partial<UserRow>;
      if (!res.ok) throw new Error(data.error || "Failed to update user");
      setUsers((prev) =>
        prev.map((u) =>
          u._id === id ? { ...u, isActive: data.isActive! } : u,
        ),
      );
    } catch (err) {
      setListError(
        err instanceof Error ? err.message : "Failed to update user",
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-4">
        <h2 className="text-base font-semibold">Create user</h2>
        <form onSubmit={onCreate} className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground">
              Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground">
              Email
            </label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground">
              Role
            </label>
            <select
              value={role}
              onChange={(e) =>
                onRoleChange(e.target.value as (typeof ROLES)[number])
              }
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">{ROLE_HINTS[role]}</p>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground">
              Password
            </label>
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
            />
          </div>

          {role === "CLIENT" && (
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium text-muted-foreground">
                Client this login belongs to
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                required
                disabled={clientsLoading}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm md:max-w-md"
              >
                <option value="">
                  {clientsLoading ? "Loading clients…" : "Select a client"}
                </option>
                {(clients ?? []).map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                The login opens the client portal for this client only.
              </p>
            </div>
          )}

          {error && (
            <p className="md:col-span-2 text-sm text-destructive">{error}</p>
          )}

          <div className="md:col-span-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Creating…" : "Create user"}
            </Button>
          </div>
        </form>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-base font-semibold">Login accounts</h2>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, role, client…"
            className="max-w-sm"
          />
        </div>
        {listError && (
          <p className="mt-2 text-sm text-destructive">{listError}</p>
        )}

        <div className="mt-4 overflow-auto rounded-md border">
          <table className="min-w-[860px] w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Name</th>
                <th className="px-3 py-2 text-left font-medium">Email</th>
                <th className="px-3 py-2 text-left font-medium">Role</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
                <th className="px-3 py-2 text-right font-medium w-[120px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u._id} className="border-t">
                  <td className="px-3 py-2 font-medium">{u.name}</td>
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="px-3 py-2">
                    <div>{u.role}</div>
                    {u.role === "CLIENT" && (
                      <div className="text-xs text-muted-foreground">
                        {u.clientName ?? "Not linked to a client"}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <Badge variant={u.isActive ? "default" : "secondary"}>
                      {u.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-right">
                    {u.isActive ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 text-amber-600"
                        title="Deactivate login"
                        onClick={() => setUserActive(u._id, false)}
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 text-green-600"
                        title="Activate login"
                        onClick={() => setUserActive(u._id, true)}
                      >
                        <UserCheck className="h-4 w-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <p className="mt-4 text-sm text-muted-foreground">No users found.</p>
        )}
      </div>
    </div>
  );
}
