"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

interface FieldMapping {
  sourceField: string;
  targetField: string;
  targetModel: string;
}

export default function NewIntegrationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    type: "GENERIC_WEBHOOK",
    clientId: "",
  });
  const [mappings, setMappings] = useState<FieldMapping[]>([
    { sourceField: "email", targetField: "email", targetModel: "Lead" },
    { sourceField: "full_name", targetField: "name", targetModel: "Lead" },
  ]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, fieldMappings: mappings }),
      });
      if (!res.ok) {
        const j = await res.json();
        setError(j.error ?? "Failed");
        return;
      }
      router.push("/dashboard/integrations?created=1");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/integrations">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              New Integration
            </h1>
            <p className="text-sm text-muted-foreground">
              Connect an external lead source.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Integration Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Name *</label>
                <Input
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Facebook Lead Ads — Client ABC"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Type</label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  value={form.type}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, type: e.target.value }))
                  }
                >
                  <option value="GENERIC_WEBHOOK">Generic Webhook</option>
                  <option value="FACEBOOK_LEADS">Facebook Lead Ads</option>
                  <option value="GOOGLE_ADS">Google Ads</option>
                  <option value="TYPEFORM">Typeform</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Client ID (for auto-assigning leads)
                </label>
                <Input
                  value={form.clientId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, clientId: e.target.value }))
                  }
                  placeholder="MongoDB ObjectId"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Field Mappings</CardTitle>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setMappings((m) => [
                    ...m,
                    { sourceField: "", targetField: "", targetModel: "Lead" },
                  ])
                }
              >
                <Plus className="mr-1 h-3 w-3" /> Add
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Map incoming JSON fields to Lead model fields.
              </p>
              {mappings.map((m, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[1fr_1fr_80px_32px] gap-2 items-center"
                >
                  <Input
                    placeholder="Source field"
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
                    placeholder="Target field"
                    value={m.targetField}
                    onChange={(e) =>
                      setMappings((ms) =>
                        ms.map((x, j) =>
                          j === i ? { ...x, targetField: e.target.value } : x,
                        ),
                      )
                    }
                  />
                  <Input
                    value={m.targetModel}
                    onChange={(e) =>
                      setMappings((ms) =>
                        ms.map((x, j) =>
                          j === i ? { ...x, targetModel: e.target.value } : x,
                        ),
                      )
                    }
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setMappings((ms) => ms.filter((_, j) => j !== i))
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Integration"}
            </Button>
            <Link href="/dashboard/integrations">
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
