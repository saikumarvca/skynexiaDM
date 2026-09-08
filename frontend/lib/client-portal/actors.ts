import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import TeamMember from "@/models/TeamMember";
import "@/models/TeamRole";
import type { ClientEventActorRole } from "@/models/ClientEvent";
import type { SessionUser } from "@/lib/auth";

/**
 * Review activity only records the actor's display name (`performedBy`).
 * This resolves that name to a client-facing actor role without exposing any
 * internal detail beyond the name itself.
 */

export type ResolvedActor = {
  actorName: string;
  actorRole: ClientEventActorRole;
  actorUserId: string | null;
};

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { value: ResolvedActor; expiresAt: number }>();

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isSystemActor(name: string) {
  const n = name.trim().toLowerCase();
  return (
    !n ||
    n === "system" ||
    n === "seed" ||
    n.startsWith("seed-") ||
    n.startsWith("seed:") ||
    n === "cron" ||
    n === "automation"
  );
}

/** Map internal role/department wording to the client-facing role set. */
export function actorRoleFromLabels(labels: {
  userRole?: string | null;
  roleName?: string | null;
  department?: string | null;
  accountType?: string | null;
}): ClientEventActorRole {
  if (labels.userRole === "ADMIN") return "ADMIN";
  const text = `${labels.roleName ?? ""} ${labels.department ?? ""}`.toLowerCase();
  if (/(develop|engineer|tech|programm|it\b)/.test(text)) return "DEVELOPER";
  if (/(agent|partner|freelanc)/.test(text)) return "AGENT";
  if (
    labels.accountType === "PARTNER_AGENCY" ||
    labels.accountType === "PARTNER_EMPLOYEE"
  ) {
    return "AGENT";
  }
  if (/(admin|owner|director)/.test(text)) return "ADMIN";
  return "EMPLOYEE";
}

export async function resolveActorByName(
  performedBy: string | null | undefined,
): Promise<ResolvedActor> {
  const name = (performedBy ?? "").trim();
  if (isSystemActor(name)) {
    return { actorName: "System", actorRole: "SYSTEM", actorUserId: null };
  }

  const key = name.toLowerCase();
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.value;

  await dbConnect();
  const rx = new RegExp(`^${escapeRegex(name)}$`, "i");

  const [user, member] = await Promise.all([
    User.findOne({ $or: [{ name: rx }, { email: rx }] })
      .select("_id name role")
      .lean(),
    TeamMember.findOne({
      isDeleted: { $ne: true },
      $or: [{ name: rx }, { email: rx }],
    })
      .select("_id name roleName department accountType userId roleId")
      .populate("roleId", "roleName")
      .lean(),
  ]);

  const populatedRole = member?.roleId as { roleName?: string } | undefined;
  const value: ResolvedActor = {
    actorName: user?.name ?? member?.name ?? name,
    actorRole: actorRoleFromLabels({
      userRole: user?.role,
      roleName: populatedRole?.roleName ?? member?.roleName,
      department: member?.department,
      accountType: member?.accountType,
    }),
    actorUserId: user?._id ? String(user._id) : (member?.userId ?? null),
  };
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value;
}

/** Actor details for a signed-in internal user (no lookup by name needed). */
export async function resolveActorForSessionUser(
  user: Pick<SessionUser, "userId" | "name" | "role" | "email">,
): Promise<ResolvedActor> {
  if (user.role === "ADMIN") {
    return { actorName: user.name, actorRole: "ADMIN", actorUserId: user.userId };
  }
  await dbConnect();
  const member = await TeamMember.findOne({
    isDeleted: { $ne: true },
    $or: [{ userId: user.userId }, { email: user.email.trim().toLowerCase() }],
  })
    .select("roleName department accountType roleId")
    .populate("roleId", "roleName")
    .lean();
  const populatedRole = member?.roleId as { roleName?: string } | undefined;
  return {
    actorName: user.name,
    actorRole: actorRoleFromLabels({
      userRole: user.role,
      roleName: populatedRole?.roleName ?? member?.roleName,
      department: member?.department,
      accountType: member?.accountType,
    }),
    actorUserId: user.userId,
  };
}

/** Test/maintenance hook. */
export function clearActorCache() {
  cache.clear();
}
