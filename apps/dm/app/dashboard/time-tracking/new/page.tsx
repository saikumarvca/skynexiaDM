"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function LogTimePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    clientId: "",
    date: new Date().toISOString().slice(0, 10),
    hours: 1,
    minutes: 0,
    description: "",
    isBillable: true,
    hourlyRate: "",
    userId: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const durationMinutes = Number(form.hours) * 60 + Number(form.minutes);
      if (durationMinutes < 1) {
        setError("Duration must be at least 1 minute");
        setLoading(false);
        return;
      }
      const res = await fetch("/api/time-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: form.clientId,
          date: new Date(form.date),
          durationMinutes,
          description: form.description,
          isBillable: form.isBillable,
          hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : undefined,
          userId: form.userId || "me",
        }),
      });
      if (!res.ok) {
        const j = await res.json();
        setError(j.error ?? "Failed to log time");
        return;
      }
      router.push("/dashboard/time-tracking?created=1");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-lg space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/time-tracking">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Log Time</h1>
            <p className="text-sm text-muted-foreground">
              Record hours worked for a client.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Entry Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Client ID *
                </label>
                <Input
                  required
                  value={form.clientId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, clientId: e.target.value }))
                  }
                  placeholder="MongoDB ObjectId"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Date *</label>
                <Input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date: e.target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Hours
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="24"
                    value={form.hours}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, hours: Number(e.target.value) }))
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Minutes
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    value={form.minutes}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        minutes: Number(e.target.value),
                      }))
                    }
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Description *
                </label>
                <Input
                  required
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="What did you work on?"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="billable"
                  checked={form.isBillable}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isBillable: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border"
                />
                <label htmlFor="billable" className="text-sm font-medium">
                  Billable
                </label>
              </div>
              {form.isBillable && (
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Hourly Rate (optional)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.hourlyRate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, hourlyRate: e.target.value }))
                    }
                    placeholder="e.g. 150"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Log Time"}
            </Button>
            <Link href="/dashboard/time-tracking">
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
