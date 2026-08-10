import { getCurrentUserTeamPermissions } from "@/lib/team/current-user-permissions";
import { requireAnyPermission } from "@/lib/team/require-permission";

export default async function SeoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const team = await getCurrentUserTeamPermissions();
  requireAnyPermission(team.permissions, ["manage_seo", "view_seo"]);
  return children;
}

