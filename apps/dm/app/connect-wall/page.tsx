import { DashboardLayout } from "@/components/dashboard-layout";
import { getCachedUser } from "@/lib/auth";
import { ConnectWallApp } from "@/components/connect-wall/connect-wall-app";

export const dynamic = "force-dynamic";

export default async function ConnectWallPage() {
  const user = await getCachedUser();

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl">
        <div className="mb-4">
          <h1 className="text-2xl font-semibold tracking-tight">Connect</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Slack-style spaces for your team — shared channels and
            real-time-friendly threads.
          </p>
        </div>
        <ConnectWallApp currentUserId={user.userId} />
      </div>
    </DashboardLayout>
  );
}
