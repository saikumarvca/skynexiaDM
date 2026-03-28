"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface TeamMemberFormProps {
  memberId?: string;
  initialData?: {
    name: string;
    email: string;
    phone?: string;
    roleId?: string;
    department?: string;
    notes?: string;
  };
  roles: { _id: string; roleName: string }[];
}

export function TeamMemberForm({
  memberId,
  initialData,
  roles,
}: TeamMemberFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialData?.name ?? "");
  const [email, setEmail] = useState(initialData?.email ?? "");
  const [phone, setPhone] = useState(initialData?.phone ?? "");
  const [roleId, setRoleId] = useState(initialData?.roleId ?? "");
  const [department, setDepartment] = useState(initialData?.department ?? "");
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const url = memberId
        ? `/api/team/members/${memberId}`
        : `/api/team/members`;
      const method = memberId ? "PATCH" : "POST";
      const body: Record<string, unknown> = {
        name,
        email,
        phone: phone || undefined,
        roleId: roleId || undefined,
        department: department || undefined,
        notes: notes || undefined,
      };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      router.push("/team/members");
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
        <label htmlFor="name" className="mb-1 block text-sm font-medium text-muted-foreground">Name *</label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-muted-foreground">Email *</label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={!!memberId}
        />
      </div>
      <div>
        <label htmlFor="phone" className="mb-1 block text-sm font-medium text-muted-foreground">Phone</label>
        <Input
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="roleId" className="mb-1 block text-sm font-medium text-muted-foreground">Role</label>
        <select
          id="roleId"
          value={roleId}
          onChange={(e) => setRoleId(e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
        >
          <option value="">Select role</option>
          {roles.map((r) => (
            <option key={r._id} value={r._id}>
              {r.roleName}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="department" className="mb-1 block text-sm font-medium text-muted-foreground">Department</label>
        <Input
          id="department"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="notes" className="mb-1 block text-sm font-medium text-muted-foreground">Notes</label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
