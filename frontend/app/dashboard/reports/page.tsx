import Link from "next/link";
import { Suspense } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { QueryToast } from "@/components/query-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Mail, Clock, Send } from "lucide-react";
import { serverFetch, getBaseUrl } from "@/lib/server-fetch";

async function getSchedules() {
  try {
    const res = await serverFetch("/api/report-schedules");
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

async function getSendLogs() {
  return [];
}

interface ReportSchedule {
  _id: string;
  name: string;
  frequency: string;
  sections: string[];
  recipients: { email: string; name: string; type: string }[];
  isActive: boolean;
  lastSentAt?: string;
  nextSendAt: string;
  clientId?: { _id: string; businessName?: string; name?: string };
}

function FrequencyBadge({ frequency }: { frequency: string }) {
  const color =
    frequency === "WEEKLY"
      ? "bg-blue-100 text-blue-800"
      : frequency === "MONTHLY"
        ? "bg-green-100 text-green-800"
        : "bg-purple-100 text-purple-800";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}
    >
      {frequency}
    </span>
  );
}

export default async function ReportsPage() {
  const schedules: ReportSchedule[] = await getSchedules();

  return (
    <DashboardLayout>
      <Suspense fallback={null}>
        <QueryToast message="Report schedule created" />
      </Suspense>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Automated Reports
            </h1>
            <p className="text-muted-foreground">
              Schedule recurring client reports delivered automatically by
              email.
            </p>
          </div>
          <Link href="/dashboard/reports/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New schedule
            </Button>
          </Link>
        </div>

        {schedules.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Mail className="mb-4 h-12 w-12 text-muted-foreground/40" />
              <p className="text-lg font-medium">No report schedules yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create a schedule to automatically email client reports.
              </p>
              <Link href="/dashboard/reports/new">
                <Button className="mt-4" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Create first schedule
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {schedules.map((s) => (
              <Card key={s._id} className={!s.isActive ? "opacity-60" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-snug">
                      {s.name}
                    </CardTitle>
                    <FrequencyBadge frequency={s.frequency} />
                  </div>
                  {s.clientId && (
                    <p className="text-sm text-muted-foreground">
                      {s.clientId.businessName ?? s.clientId.name}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-1">
                    {s.sections.map((sec) => (
                      <span
                        key={sec}
                        className="rounded bg-muted px-2 py-0.5 text-xs capitalize"
                      >
                        {sec}
                      </span>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">{s.recipients.length}</span>{" "}
                    recipient{s.recipients.length !== 1 ? "s" : ""}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Next: {new Date(s.nextSendAt).toLocaleDateString()}
                    {s.lastSentAt && (
                      <>
                        {" "}
                        &middot; Last:{" "}
                        {new Date(s.lastSentAt).toLocaleDateString()}
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <form
                      action={`/api/report-schedules/${s._id}/send-now`}
                      method="POST"
                    >
                      <Button type="submit" size="sm" variant="outline">
                        <Send className="mr-1.5 h-3 w-3" />
                        Send now
                      </Button>
                    </form>
                    <Link href={`/dashboard/reports/${s._id}/edit`}>
                      <Button size="sm" variant="ghost">
                        Edit
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
