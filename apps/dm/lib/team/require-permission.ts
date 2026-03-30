import { redirect } from "next/navigation";

export function hasAnyPermission(
  perms: string[],
  requiredAnyOf: string[] | undefined,
): boolean {
  if (!requiredAnyOf || requiredAnyOf.length === 0) return true;
  const set = new Set(perms);
  return requiredAnyOf.some((p) => set.has(p));
}

export function requireAnyPermission(
  perms: string[],
  requiredAnyOf: string[] | undefined,
  redirectTo = "/dashboard",
) {
  if (!hasAnyPermission(perms, requiredAnyOf)) redirect(redirectTo);
}

