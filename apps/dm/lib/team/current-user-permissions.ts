import { cache } from "react";
import dbConnect from "@/lib/mongodb";
import { getCachedUser } from "@/lib/auth";
import TeamMember from "@/models/TeamMember";

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
  };
}

/** Per-request cached lookup (safe for server components/layouts). */
export const getCurrentUserTeamPermissions = cache(
  loadCurrentUserTeamPermissions,
);

