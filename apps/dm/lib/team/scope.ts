type AuthzContext = {
  perms: string[];
  teamMemberId?: string;
  agencyId?: string;
  agencyKind?: "MAIN_EMPLOYEE" | "PARTNER_EMPLOYEE";
  assignedClientIds?: string[];
};

export function isAdminScope(authz: AuthzContext) {
  return authz.perms.includes("manage_settings");
}

export function applyAgencyScope<
  T extends {
    agencyId?: string;
    assignedPartnerAgencyId?: string;
    assignedToUserId?: string;
  },
>(items: T[], authz: AuthzContext): T[] {
  if (isAdminScope(authz)) return items;
  if (!authz.agencyId) return items;

  const isPartner = authz.agencyKind === "PARTNER_EMPLOYEE";
  if (!isPartner) {
    return items.filter(
      (item) =>
        !item.agencyId ||
        item.agencyId === authz.agencyId ||
        item.assignedPartnerAgencyId === authz.agencyId,
    );
  }

  return items.filter((item) => {
    if (item.assignedToUserId && authz.teamMemberId) {
      return item.assignedToUserId === authz.teamMemberId;
    }
    return item.assignedPartnerAgencyId === authz.agencyId;
  });
}

export function canAccessClient(authz: AuthzContext, clientId?: string | null) {
  if (!clientId) return true;
  if (isAdminScope(authz)) return true;
  const assigned = authz.assignedClientIds ?? [];
  if (assigned.length === 0) return true;
  return assigned.includes(clientId);
}

