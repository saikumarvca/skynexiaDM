import { getCurrentUserTeamPermissions } from "@/lib/team/current-user-permissions";
import { requireAnyPermission } from "@/lib/team/require-permission";

export default async function TasksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const team = await getCurrentUserTeamPermissions();
  requireAnyPermission(team.permissions, [
    "manage_tasks",
    "view_tasks",
    "work_assigned_tasks",
    "assign_tasks",
  ]);
  return children;
}

