"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Trash2, Copy, Check } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

type IntegrationTypeOption =
  | "FACEBOOK_LEADS"
  | "GOOGLE_ADS"
  | "TYPEFORM"
  | "GENERIC_WEBHOOK";

const INTEGRATION_TYPES: { value: IntegrationTypeOption; label: string }[] = [
  { value: "GENERIC_WEBHOOK", label: "Generic Webhook" },
  { value: "FACEBOOK_LEADS", label: "Facebook Lead Ads" },
  { value: "GOOGLE_ADS", label: "Google Ads" },
  { value: "TYPEFORM", label: "Typeform" },
];

interface FieldMappingRow {
  sourceField: string;
  targetField: string;
}

export interface NewIntegrationFormProps {
  clients: { _id: string; name: string }[];
}

export function NewIntegrationForm({ clients }: NewIntegrationFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [created, setCreated] = useState<{
    id: string;
    apiKey: string;
    name: string;
  } | null>(null);
  const [form, setForm] = useState({
    name: "",
    type: "GENERIC_WEBHOOK" as IntegrationTypeOption,
    clientId: "",
  });
  const [mappings, setMappings] = useState<FieldMappingRow[]>([
    { sourceField: "email", targetField: "email" },
    { sourceField: "full_name", targetField: "name" },
  ]);

  const ingestUrl =
    typeof window !== "undefined" && created
      ? `${window.location.origin}/api/integrations/${created.id}/ingest`
      : "";

  async function copyText(text: string, which: "key" | "url") {
    try {
      await navigator.clipboard.writeText(text);
      if (which === "key") {
        setCopiedKey(true);
        setTimeout(() => setCopiedKey(false), 2000);
      } else {
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
      }
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Could not copy");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const trimmedMappings = mappings
      .map((m) => ({
        sourceField: m.sourceField.trim(),
        targetField: m.targetField.trim(),
      }))
      .filter((m) => m.sourceField && m.targetField);

    if (trimmedMappings.length === 0) {
      setError("Add at least one field mapping with source and target.");
      setLoading(false);
      return;
    }

    const payload: {
      name: string;
      type: IntegrationTypeOption;
      clientId?: string;
      fieldMappings: { sourceField: string; targetField: string; targetModel: string }[];
    } = {
      name: form.name.trim(),
      type: form.type,
      fieldMappings: trimmedMappings.map((m) => ({
        ...m,
        targetModel: "Lead",
      })),
    };

    const client = form.clientId.trim();
    if (client) payload.clientId = client;

    try {
      const res = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof j.error === "string" ? j.error : "Failed to create integration");
        return;
      }
      if (!j._id || !j.apiKey) {
        setError("Unexpected response from server");
        return;
      }
      setCreated({
        id: String(j._id),
        apiKey: String(j.apiKey),
        name: String(j.name ?? payload.name),
      });
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (created) {
    return (
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/integrations">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Integration created</h1>
            <p className="text-sm text-muted-foreground">{created.name}</p>
          </div>
        </div>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-base">Save these credentials</CardTitle>
            <p className="text-sm font-normal text-muted-foreground">
              The API key is only shown here. Copy it now — the integrations list only shows a
              preview.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Ingest URL</p>
              <div className="flex gap-2">
                <code className="flex-1 break-all rounded-md border bg-muted px-3 py-2 text-xs">
                  {ingestUrl}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  onClick={() => copyText(ingestUrl, "url")}
                  title="Copy URL"
                >
                  {copiedUrl ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                API key (header: X-API-Key)
              </p>
              <div className="flex gap-2">
                <code className="flex-1 break-all rounded-md border bg-muted px-3 py-2 text-xs">
                  {created.apiKey}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  onClick={() => copyText(created.apiKey, "key")}
                  title="Copy API key"
                >
                  {copiedKey ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <Button
              onClick={() =>
                router.push("/dashboard/integrations?created=1")
              }
            >
              Done — view integrations
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/integrations">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Integration</h1>
          <p className="text-sm text-muted-foreground">
            Connect an external lead source via inbound JSON webhook.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Integration details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="integration-name" className="text-sm font-medium">
                Name *
              </label>
              <Input
                id="integration-name"
                required
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Facebook Lead Ads — Client ABC"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="integration-type" className="text-sm font-medium">
                Type
              </label>
              <select
                id="integration-type"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={form.type}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    type: e.target.value as IntegrationTypeOption,
                  }))
                }
              >
                {INTEGRATION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Used for labeling and the lead &quot;source&quot; field. Payload shape is normalized
                with your field mappings below.
              </p>
            </div>
            <div className="space-y-2">
              <label htmlFor="integration-client" className="text-sm font-medium">
                Client {!clients.length ? "" : "(recommended)"}
              </label>
              <select
                id="integration-client"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={form.clientId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, clientId: e.target.value }))
                }
              >
                <option value="">None — inbound events won&apos;t create leads until configured</option>
                {clients.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Ingestion creates leads only when a client is set and mappings populate at least
                name or email.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Field mappings</CardTitle>
              <p className="mt-1 text-xs font-normal text-muted-foreground">
                Top-level JSON keys → Lead fields (e.g. email, name, phone).
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                setMappings((m) => [...m, { sourceField: "", targetField: "" }])
              }
            >
              <Plus className="mr-1 h-3 w-3" /> Add row
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-[1fr_1fr_40px] gap-2 text-xs font-medium text-muted-foreground">
              <span>Source (JSON key)</span>
              <span>Target (Lead field)</span>
              <span className="sr-only">Remove</span>
            </div>
            {mappings.map((m, i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_1fr_40px] gap-2 items-center"
              >
                <Input
                  placeholder="e.g. email"
                  value={m.sourceField}
                  onChange={(e) =>
                    setMappings((ms) =>
                      ms.map((x, j) =>
                        j === i ? { ...x, sourceField: e.target.value } : x,
                      ),
                    )
                  }
                />
                <Input
                  placeholder="e.g. email"
                  value={m.targetField}
                  onChange={(e) =>
                    setMappings((ms) =>
                      ms.map((x, j) =>
                        j === i ? { ...x, targetField: e.target.value } : x,
                      ),
                    )
                  }
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 shrink-0"
                  onClick={() =>
                    setMappings((ms) => ms.filter((_, j) => j !== i))
                  }
                  title="Remove row"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? "Creating…" : "Create integration"}
          </Button>
          <Link href="/dashboard/integrations">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
