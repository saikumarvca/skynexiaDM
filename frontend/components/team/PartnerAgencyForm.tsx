"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type FormData = {
  name: string;
  code?: string;
  status?: "ACTIVE" | "INACTIVE";
  contactName?: string;
  contactEmail?: string;
  phone?: string;
  notes?: string;
};

export function PartnerAgencyForm({
  partnerAgencyId,
  initialData,
}: {
  partnerAgencyId?: string;
  initialData?: FormData;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialData?.name ?? "");
  const [code, setCode] = useState(initialData?.code ?? "");
  const [status, setStatus] = useState(initialData?.status ?? "ACTIVE");
  const [contactName, setContactName] = useState(initialData?.contactName ?? "");
  const [contactEmail, setContactEmail] = useState(initialData?.contactEmail ?? "");
  const [phone, setPhone] = useState(initialData?.phone ?? "");
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const url = partnerAgencyId
        ? `/api/partner-agencies/${partnerAgencyId}`
        : "/api/partner-agencies";
      const method = partnerAgencyId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          code: code || undefined,
          status,
          contactName: contactName || undefined,
          contactEmail: contactEmail || undefined,
          phone: phone || undefined,
          notes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save partner agency");
      router.push(
        partnerAgencyId
          ? `/admin/partner-agencies/${partnerAgencyId}`
          : "/admin/partner-agencies",
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save partner agency");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? (
        <div className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-muted-foreground">Name *</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted-foreground">Code</label>
          <Input value={code} onChange={(e) => setCode(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted-foreground">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "ACTIVE" | "INACTIVE")}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted-foreground">Phone</label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted-foreground">Contact name</label>
          <Input
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted-foreground">Contact email</label>
          <Input
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            type="email"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm text-muted-foreground">Notes</label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/partner-agencies")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
