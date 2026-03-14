import { PERMISSION_LIST, Permission } from '@/types/team';

export { PERMISSION_LIST };

export function hasPermission(
  rolePermissions: string[],
  perm: Permission | string
): boolean {
  return rolePermissions.includes(perm);
}

export function getPermissionLabel(perm: string): string {
  return perm
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}
