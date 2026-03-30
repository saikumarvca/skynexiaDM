import { cache } from "react";
import dbConnect from "@/lib/mongodb";
import { getCachedUser } from "@/lib/auth";
import { PERMISSION_LIST } from "@/lib/team/permissions";
import TeamMember from "@/models/TeamMember";
import TeamRole from "@/models/TeamRole";

export type CurrentUserTeamPermissions = {
  teamMemberId?: string;
  roleId?: string;
  roleName?: string;
  permissions: string[];
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
    };
  }

  await dbConnect();

  const emailNorm = normalizeEmail(user.email);
  const member = await TeamMember.findOne({
    isDeleted: { $ne: true },
    $or: [{ userId: user.userId }, { email: emailNorm }],
  })
    .select("_id roleId roleName")
    .lean();

  if (!member) return { permissions: [] };

  const roleId =
    member.roleId && typeof member.roleId === "object" && "toString" in member.roleId
      ? (member.roleId as { toString(): string }).toString()
      : member.roleId
        ? String(member.roleId)
        : undefined;

  const role = roleId
    ? await TeamRole.findById(roleId).select("_id roleName permissions").lean()
    : null;

  const perms = Array.isArray(role?.permissions) ? role.permissions : [];

  return {
    teamMemberId: member._id?.toString?.() ?? String(member._id),
    roleId: role?._id ? String(role._id) : roleId,
    roleName: role?.roleName ?? member.roleName,
    permissions: perms,
  };
}

/** Per-request cached lookup (safe for server components/layouts). */
export const getCurrentUserTeamPermissions = cache(
  loadCurrentUserTeamPermissions,
);

