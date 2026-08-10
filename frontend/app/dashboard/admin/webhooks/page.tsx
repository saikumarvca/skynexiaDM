import { DashboardLayout } from "@/components/dashboard-layout";
import { requireUser, assertAdmin } from "@/lib/auth";
import { serverFetch } from "@/lib/server-fetch";
import { WebhooksClient } from "@/components/admin/webhooks-client";

type WebhookRow = {
  _id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  lastTriggeredAt?: string | null;
  secret?: string;
};

async function getWebhooks(): Promise<WebhookRow[]> {
  const res = await serverFetch("/api/webhooks", { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export default async function AdminWebhooksPage() {
  const user = await requireUser();
  assertAdmin(user);

  const webhooks = await getWebhooks();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Webhooks</h1>
          <p className="text-muted-foreground">
            Configure HTTP endpoints to receive event notifications.
          </p>
        </div>
        <WebhooksClient initialWebhooks={webhooks} />
      </div>
    </DashboardLayout>
  );
}
