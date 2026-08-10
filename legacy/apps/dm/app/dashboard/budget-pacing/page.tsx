import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
} from "lucide-react";
import { serverFetch } from "@/lib/server-fetch";

async function getBudgetAlerts() {
  try {
    const res = await serverFetch("/api/budget-alerts?acknowledged=false");
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

interface BudgetAlert {
  _id: string;
  threshold: number;
  spendToDate: number;
  budget: number;
  triggeredAt: string;
  isAcknowledged: boolean;
  campaignId?: { _id: string; campaignName: string; platform: string };
  clientId?: { _id: string; businessName?: string; name?: string };
}

function ThresholdBadge({ threshold }: { threshold: number }) {
  const pct = Math.round(threshold * 100);
  const color =
    pct >= 100
      ? "bg-red-100 text-red-800"
      : pct >= 90
        ? "bg-orange-100 text-orange-800"
        : "bg-yellow-100 text-yellow-800";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${color}`}
    >
      {pct}% threshold
    </span>
  );
}

export default async function BudgetPacingPage() {
  const alerts: BudgetAlert[] = await getBudgetAlerts();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budget Pacing</h1>
          <p className="text-muted-foreground">
            Monitor campaign spend against budget thresholds.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 py-5">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">
                  {alerts.filter((a) => a.threshold >= 1.0).length}
                </p>
                <p className="text-sm text-muted-foreground">Over budget</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 py-5">
              <TrendingUp className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">
                  {
                    alerts.filter(
                      (a) => a.threshold >= 0.9 && a.threshold < 1.0,
                    ).length
                  }
                </p>
                <p className="text-sm text-muted-foreground">
                  Near limit (90%+)
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 py-5">
              <CheckCircle2 className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">
                  {alerts.filter((a) => a.threshold < 0.9).length}
                </p>
                <p className="text-sm text-muted-foreground">
                  75% threshold alerts
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Active Budget Alerts ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <CheckCircle2 className="mx-auto mb-3 h-10 w-10 opacity-30" />
                <p>
                  No unacknowledged budget alerts. All campaigns are within
                  thresholds.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert._id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {alert.campaignId?.campaignName ?? "Unknown Campaign"}
                        </p>
                        <ThresholdBadge threshold={alert.threshold} />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {alert.clientId?.businessName ?? alert.clientId?.name}
                        {" · "}
                        {alert.campaignId?.platform}
                      </p>
                      <p className="text-sm">
                        Spent:{" "}
                        <strong>${alert.spendToDate.toLocaleString()}</strong>{" "}
                        of ${alert.budget.toLocaleString()} budget
                        {" · "}
                        <span className="text-muted-foreground">
                          Triggered{" "}
                          {new Date(alert.triggeredAt).toLocaleDateString()}
                        </span>
                      </p>
                    </div>
                    <form
                      action={`/api/budget-alerts/${alert._id}/acknowledge`}
                      method="POST"
                    >
                      <button
                        type="submit"
                        className="rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted"
                      >
                        Acknowledge
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
