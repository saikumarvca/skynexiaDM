import { getCurrentUserTeamPermissions } from "@/lib/team/current-user-permissions";
import { requireAnyPermission } from "@/lib/team/require-permission";

export default async function ConnectWallLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const team = await getCurrentUserTeamPermissions();
  requireAnyPermission(team.permissions, [
    "manage_clients",
    "view_clients",
    "manage_leads",
    "view_leads",
    "manage_reviews",
    "view_reviews",
    "work_assigned_reviews",
  ]);
  return children;
}

