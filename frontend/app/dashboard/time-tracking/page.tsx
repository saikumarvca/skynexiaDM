import Link from "next/link";
import { Suspense } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { QueryToast } from "@/components/query-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Clock, DollarSign } from "lucide-react";
import { serverFetch } from "@/lib/server-fetch";

async function getTimeEntries(params: { clientId?: string; month?: string }) {
  try {
    const url = new URL("/api/time-entries", "http://localhost");
    if (params.clientId) url.searchParams.set("clientId", params.clientId);
    const res = await serverFetch(url.pathname + url.search);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

async function getTimeSummary(params: { clientId?: string; month?: string }) {
  try {
    const url = new URL("/api/time-entries/summary", "http://localhost");
    if (params.clientId) url.searchParams.set("clientId", params.clientId);
    if (params.month) url.searchParams.set("month", params.month);
    const res = await serverFetch(url.pathname + url.search);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

interface TimeEntry {
  _id: string;
  userId: string;
  date: string;
  durationMinutes: number;
  description: string;
  isBillable: boolean;
  clientId?: { _id: string; businessName?: string; name?: string };
}

interface PageProps {
  searchParams: Promise<{ clientId?: string; month?: string }>;
}

export default async function TimeTrackingPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const currentMonth = params.month ?? new Date().toISOString().slice(0, 7);
  const [entries, summary] = await Promise.all([
    getTimeEntries(params),
    getTimeSummary({ ...params, month: currentMonth }),
  ]);

  return (
    <DashboardLayout>
      <Suspense fallback={null}>
        <QueryToast message="Time entry logged" />
      </Suspense>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Time Tracking</h1>
            <p className="text-muted-foreground">
              Log billable and non-billable hours per client.
            </p>
          </div>
          <Link href="/dashboard/time-tracking/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Log Time
            </Button>
          </Link>
        </div>

        {summary && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-4 py-5">
                <Clock className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{summary.totalHours}h</p>
                  <p className="text-sm text-muted-foreground">
                    Total this month
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 py-5">
                <DollarSign className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{summary.billableHours}h</p>
                  <p className="text-sm text-muted-foreground">
                    Billable hours
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 py-5">
                <Clock className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">
                    {summary.nonBillableHours}h
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Non-billable hours
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5" />
                Time Entries ({entries.length})
              </CardTitle>
              <form method="get" className="flex gap-2">
                <input
                  type="month"
                  name="month"
                  defaultValue={currentMonth}
                  className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                />
                <button
                  type="submit"
                  className="h-8 rounded-md border border-input bg-background px-3 text-sm hover:bg-muted"
                >
                  Filter
                </button>
              </form>
            </div>
          </CardHeader>
          <CardContent>
            {entries.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Clock className="mx-auto mb-3 h-10 w-10 opacity-30" />
                <p>No time entries yet.</p>
                <Link href="/dashboard/time-tracking/new">
                  <Button className="mt-4" variant="outline">
                    Log your first entry
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-4 font-medium">Date</th>
                      <th className="pb-2 pr-4 font-medium">Client</th>
                      <th className="pb-2 pr-4 font-medium">Description</th>
                      <th className="pb-2 pr-4 font-medium">Duration</th>
                      <th className="pb-2 font-medium">Billable</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((e: TimeEntry) => (
                      <tr
                        key={e._id}
                        className="border-b last:border-0 hover:bg-muted/40"
                      >
                        <td className="py-2.5 pr-4 text-muted-foreground">
                          {new Date(e.date).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 pr-4">
                          {e.clientId?.businessName ?? e.clientId?.name ?? "—"}
                        </td>
                        <td className="py-2.5 pr-4">{e.description}</td>
                        <td className="py-2.5 pr-4 font-medium">
                          {(e.durationMinutes / 60).toFixed(1)}h
                        </td>
                        <td className="py-2.5">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${e.isBillable ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground"}`}
                          >
                            {e.isBillable ? "Billable" : "Non-billable"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
