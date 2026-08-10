import Link from "next/link";
import { Suspense } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { QueryToast } from "@/components/query-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Zap, Circle, CheckCircle2, AlertCircle } from "lucide-react";
import { serverFetch } from "@/lib/server-fetch";

async function getIntegrations() {
  try {
    const res = await serverFetch("/api/integrations");
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

interface Integration {
  _id: string;
  name: string;
  type: string;
  isActive: boolean;
  lastReceivedAt?: string;
  apiKey: string;
}

const TYPE_LABELS: Record<string, string> = {
  FACEBOOK_LEADS: "Facebook Lead Ads",
  GOOGLE_ADS: "Google Ads",
  TYPEFORM: "Typeform",
  GENERIC_WEBHOOK: "Generic Webhook",
};

export default async function IntegrationsPage() {
  const integrations: Integration[] = await getIntegrations();

  return (
    <DashboardLayout>
      <Suspense fallback={null}>
        <QueryToast message="Integration created" />
      </Suspense>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
            <p className="text-muted-foreground">
              Connect external lead sources and data pipelines.
            </p>
          </div>
          <Link href="/dashboard/integrations/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Integration
            </Button>
          </Link>
        </div>

        {integrations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Zap className="mb-4 h-12 w-12 text-muted-foreground/40" />
              <p className="text-lg font-medium">No integrations yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Connect external lead sources like Facebook Lead Ads or
                Typeform.
              </p>
              <Link href="/dashboard/integrations/new">
                <Button className="mt-4" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Create first integration
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {integrations.map((int) => (
              <Card key={int._id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{int.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {TYPE_LABELS[int.type] ?? int.type}
                      </p>
                    </div>
                    {int.isActive ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 shrink-0 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-md bg-muted px-3 py-2">
                    <p className="text-xs text-muted-foreground mb-1">
                      Ingest endpoint
                    </p>
                    <code className="text-xs break-all">
                      /api/integrations/{int._id}/ingest
                    </code>
                  </div>
                  <div className="rounded-md bg-muted px-3 py-2">
                    <p className="text-xs text-muted-foreground mb-1">
                      API Key (x-api-key header)
                    </p>
                    <code className="text-xs break-all">
                      {int.apiKey.slice(0, 16)}…
                    </code>
                  </div>
                  {int.lastReceivedAt && (
                    <p className="text-xs text-muted-foreground">
                      Last received:{" "}
                      {new Date(int.lastReceivedAt).toLocaleString()}
                    </p>
                  )}
                  <div className="flex gap-2 pt-1">
                    <Link href={`/dashboard/integrations/${int._id}/events`}>
                      <Button size="sm" variant="outline">
                        View events
                      </Button>
                    </Link>
                    <Link href={`/dashboard/integrations/${int._id}/edit`}>
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
