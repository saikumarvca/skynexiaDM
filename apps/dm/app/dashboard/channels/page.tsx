import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users } from "lucide-react";

export default async function ChannelsOverviewPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Channels</h1>
          <p className="text-muted-foreground">
            Track subscriber counts per connected channel. Data is populated
            when integrations or scheduled sync jobs write to channel metrics.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              Channel subscribers
            </CardTitle>
            <CardDescription>
              List of channels with latest subscriber snapshots from the
              database.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/channels/subscribe">Open subscriber metrics</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
