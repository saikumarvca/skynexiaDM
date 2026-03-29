import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Search, Plus } from "lucide-react";

export default async function ClientSeoPage({
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
            <h1 className="text-3xl font-bold tracking-tight">SEO</h1>
            <p className="text-muted-foreground">
              Keywords and ranking data for this client.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/dashboard/seo?clientId=${clientId}`}>
              <Button variant="outline">
                <Search className="mr-2 h-4 w-4" />
                View keywords
              </Button>
            </Link>
            <Link href={`/dashboard/seo/new?clientId=${clientId}`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add keyword
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
