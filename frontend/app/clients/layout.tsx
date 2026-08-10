import { getCurrentUserTeamPermissions } from "@/lib/team/current-user-permissions";
import { requireAnyPermission } from "@/lib/team/require-permission";

export default async function ClientsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const team = await getCurrentUserTeamPermissions();
  requireAnyPermission(team.permissions, ["manage_clients", "view_clients"]);
  return children;
}

