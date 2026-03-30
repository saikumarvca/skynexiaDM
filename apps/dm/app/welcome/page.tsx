import { redirect } from "next/navigation";
import { getCachedUser } from "@/lib/auth";
import { getCurrentUserTeamPermissions } from "@/lib/team/current-user-permissions";
import { WelcomeAccessPanel } from "@/components/access/welcome-access-panel";

export const dynamic = "force-dynamic";

export default async function WelcomePage() {
  let user: Awaited<ReturnType<typeof getCachedUser>>;
  try {
    user = await getCachedUser();
  } catch {
    redirect("/login");
  }

  const team = await getCurrentUserTeamPermissions();
  const isAdmin = user.role === "ADMIN";

  return (
    <main className="min-h-dvh bg-background p-6 sm:p-10">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <WelcomeAccessPanel
          userName={user.name}
          isAdmin={isAdmin}
          permissions={team.permissions}
        />
      </div>
    </main>
  );
}

