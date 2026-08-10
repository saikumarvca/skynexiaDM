import bcrypt from "bcryptjs";
import type { HydratedDocument } from "mongoose";
import User, { type IUser, type UserRole } from "@/models/User";
import type { ITeamMember } from "@/models/TeamMember";

export function teamRoleNameToAppUserRole(roleName?: string): UserRole {
  const r = (roleName ?? "").toLowerCase();
  if (r.includes("admin")) return "ADMIN";
  if (r.includes("design")) return "DESIGNER";
  if (r.includes("content") || r.includes("writer")) return "CONTENT_WRITER";
  if (r.includes("analyst")) return "ANALYST";
  return "MANAGER";
}

export async function findLinkedUserForTeamMember(
  member: Pick<ITeamMember, "userId" | "email">,
): Promise<HydratedDocument<IUser> | null> {
  const emailNorm = member.email.trim().toLowerCase();
  if (member.userId) {
    const byId = await User.findById(member.userId);
    if (byId) return byId;
  }
  return User.findOne({ email: emailNorm });
}

/**
 * Keeps the dashboard User (login) in sync with a team member.
 * - With `password`: creates a User or sets passwordHash; links `member.userId` when creating.
 * - Without `password`: updates name, email, role, isActive on an existing linked User only.
 */
export async function syncLoginUserFromTeamMember(
  member: HydratedDocument<ITeamMember>,
  options: { password?: string } = {},
): Promise<void> {
  const emailNorm = member.email.trim().toLowerCase();
  const appRole = teamRoleNameToAppUserRole(member.roleName);
  const isActive = member.status === "Active";

  let user = await findLinkedUserForTeamMember(member);

  if (options.password) {
    const passwordHash = await bcrypt.hash(options.password, 12);
    if (user) {
      user.passwordHash = passwordHash;
      user.name = member.name;
      user.email = emailNorm;
      user.role = appRole;
      user.isActive = isActive;
      await user.save();
      if (!member.userId) {
        member.userId = user._id.toString();
        await member.save();
      }
      return;
    }

    const created = await User.create({
      email: emailNorm,
      name: member.name,
      role: appRole,
      passwordHash,
      isActive,
    });
    member.userId = created._id.toString();
    await member.save();
    return;
  }

  if (!user) return;

  user.name = member.name;
  user.email = emailNorm;
  user.role = appRole;
  user.isActive = isActive;
  await user.save();
  if (!member.userId) {
    member.userId = user._id.toString();
    await member.save();
  }
}

/** Disables login for the User linked to a team member (by userId or email). */
export async function deactivateLinkedLoginForTeamMember(
  member: Pick<ITeamMember, "userId" | "email">,
): Promise<void> {
  const user = await findLinkedUserForTeamMember(member);
  if (!user) return;
  user.isActive = false;
  await user.save();
}
