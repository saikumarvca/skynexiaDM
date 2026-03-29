"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

const SECTIONS = ["campaigns", "leads", "seo", "reviews", "tasks"];

export default function NewReportSchedulePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    clientId: "",
    frequency: "MONTHLY",
    dayOfMonth: 1,
    sections: ["campaigns", "leads"] as string[],
    sendTime: "08:00",
    timeZone: "UTC",
  });
  const [recipients, setRecipients] = useState([
    { email: "", name: "", type: "INTERNAL" },
  ]);

  function toggleSection(sec: string) {
    setForm((f) => ({
      ...f,
      sections: f.sections.includes(sec)
        ? f.sections.filter((s) => s !== sec)
        : [...f.sections, sec],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/report-schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          recipients: recipients.filter((r) => r.email),
        }),
      });
      if (!res.ok) {
        const j = await res.json();
        setError(j.error ?? "Failed to create schedule");
        return;
      }
      router.push("/dashboard/reports?created=1");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/reports">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              New Report Schedule
            </h1>
            <p className="text-sm text-muted-foreground">
              Configure a recurring automated report.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Basic Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Report name *
                </label>
                <Input
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Monthly Client Report"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Client ID
                </label>
                <Input
                  value={form.clientId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, clientId: e.target.value }))
                  }
                  placeholder="MongoDB ObjectId of the client"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Frequency
                  </label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                    value={form.frequency}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, frequency: e.target.value }))
                    }
                  >
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Day of month
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={28}
                    value={form.dayOfMonth}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        dayOfMonth: parseInt(e.target.value),
                      }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sections to include</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {SECTIONS.map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => toggleSection(sec)}
                    className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                      form.sections.includes(sec)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {sec}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Recipients</CardTitle>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setRecipients((r) => [
                    ...r,
                    { email: "", name: "", type: "INTERNAL" },
                  ])
                }
              >
                <Plus className="mr-1 h-3 w-3" /> Add
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {recipients.map((rec, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    type="email"
                    placeholder="Email"
                    value={rec.email}
                    onChange={(e) =>
                      setRecipients((r) =>
                        r.map((x, j) =>
                          j === i ? { ...x, email: e.target.value } : x,
                        ),
                      )
                    }
                    className="flex-1"
                  />
                  <Input
                    placeholder="Name"
                    value={rec.name}
                    onChange={(e) =>
                      setRecipients((r) =>
                        r.map((x, j) =>
                          j === i ? { ...x, name: e.target.value } : x,
                        ),
                      )
                    }
                    className="flex-1"
                  />
                  <select
                    className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                    value={rec.type}
                    onChange={(e) =>
                      setRecipients((r) =>
                        r.map((x, j) =>
                          j === i ? { ...x, type: e.target.value } : x,
                        ),
                      )
                    }
                  >
                    <option value="INTERNAL">Internal</option>
                    <option value="CLIENT">Client</option>
                  </select>
                  {recipients.length > 1 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setRecipients((r) => r.filter((_, j) => j !== i))
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Schedule"}
            </Button>
            <Link href="/dashboard/reports">
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
