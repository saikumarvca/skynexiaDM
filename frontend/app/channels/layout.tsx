import { getCurrentUserTeamPermissions } from "@/lib/team/current-user-permissions";
import { requireAnyPermission } from "@/lib/team/require-permission";

export default async function ChannelsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const team = await getCurrentUserTeamPermissions();
  requireAnyPermission(team.permissions, [
    "view_analytics",
    "view_content",
    "manage_content",
  ]);
  return children;
}
