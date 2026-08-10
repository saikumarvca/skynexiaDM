import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, LineChart, Plus } from "lucide-react";

export default async function ClientLeadsPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link
              href={`/clients/${clientId}`}
              className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-flex items-center gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to client
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
            <p className="text-muted-foreground">
              Leads generated for this client.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/dashboard/leads?clientId=${clientId}`}>
              <Button variant="outline">
                <LineChart className="mr-2 h-4 w-4" />
                View leads
              </Button>
            </Link>
            <Link href={`/dashboard/leads/new?clientId=${clientId}`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add lead
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
