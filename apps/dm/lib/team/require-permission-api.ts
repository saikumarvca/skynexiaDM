import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { requireUserFromRequest } from "@/lib/auth";
import { PERMISSION_LIST } from "@/lib/team/permissions";
import TeamMember from "@/models/TeamMember";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function loadTeamContextForRequest(req: NextRequest): Promise<{
  perms: string[];
  teamMemberId?: string;
}> {
  const user = await requireUserFromRequest(req);

  // Full bypass for platform admins.
  if (user.role === "ADMIN") {
    return { perms: [...PERMISSION_LIST] };
  }

  await dbConnect();

  const emailNorm = normalizeEmail(user.email);
  const member = await TeamMember.findOne({
    isDeleted: { $ne: true },
    $or: [{ userId: user.userId }, { email: emailNorm }],
  })
    .populate("roleId", "permissions")
    .lean();

  const role = member?.roleId as { permissions?: string[] } | undefined;
  return {
    perms: Array.isArray(role?.permissions) ? role!.permissions! : [],
    teamMemberId: member?._id?.toString?.() ?? (member?._id ? String(member._id) : undefined),
  };
}

export function jsonForbidden(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function jsonUnauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function requireAnyPermissionApi(
  req: NextRequest,
  requiredAnyOf: string[] | undefined,
): Promise<{
  perms: string[];
  teamMemberId?: string;
  denied: NextResponse | null;
}> {
  try {
    const ctx = await loadTeamContextForRequest(req);
    const perms = ctx.perms;
    if (!requiredAnyOf || requiredAnyOf.length === 0) {
      return { perms, teamMemberId: ctx.teamMemberId, denied: null };
    }
    const set = new Set(perms);
    const ok = requiredAnyOf.some((p) => set.has(p));
    if (!ok) return { perms, teamMemberId: ctx.teamMemberId, denied: jsonForbidden() };
    return { perms, teamMemberId: ctx.teamMemberId, denied: null };
  } catch {
    return { perms: [], denied: jsonUnauthorized() };
  }
}

