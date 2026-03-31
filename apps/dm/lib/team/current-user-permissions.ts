import { cache } from "react";
import dbConnect from "@/lib/mongodb";
import { getCachedUser } from "@/lib/auth";
import { PERMISSION_LIST } from "@/lib/team/permissions";
import TeamMember from "@/models/TeamMember";
import "@/models/TeamRole";

export type CurrentUserTeamPermissions = {
  teamMemberId?: string;
  roleId?: string;
  roleName?: string;
  permissions: string[];
  agencyId?: string;
  agencyKind?: "MAIN_EMPLOYEE" | "PARTNER_EMPLOYEE";
  assignedClientIds?: string[];
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function loadCurrentUserTeamPermissions(): Promise<CurrentUserTeamPermissions> {
  const user = await getCachedUser();

  if (user.role === "ADMIN") {
    return {
      roleName: "Admin",
      permissions: [...PERMISSION_LIST],
      agencyId: user.agencyId,
      agencyKind: user.agencyKind,
    };
  }

  await dbConnect();

  const emailNorm = normalizeEmail(user.email);
  const member = await TeamMember.findOne({
    isDeleted: { $ne: true },
    $or: [{ userId: user.userId }, { email: emailNorm }],
  })
    .populate("roleId", "roleName permissions")
    .lean();

  if (!member) return { permissions: [] };

  const populatedRole = member.roleId as
    | { _id: unknown; roleName?: string; permissions?: string[] }
    | undefined;

  const perms = Array.isArray(populatedRole?.permissions)
    ? populatedRole.permissions
    : [];

  return {
    teamMemberId: member._id?.toString?.() ?? String(member._id),
    roleId: populatedRole?._id ? String(populatedRole._id) : undefined,
    roleName: populatedRole?.roleName ?? member.roleName,
    permissions: perms,
    agencyId: user.agencyId,
    agencyKind: user.agencyKind,
    assignedClientIds: Array.isArray(member.assignedClientIds)
      ? member.assignedClientIds.map((id) => String(id))
      : [],
  };
}

/** Per-request cached lookup (safe for server components/layouts). */
export const getCurrentUserTeamPermissions = cache(
  loadCurrentUserTeamPermissions,
);

