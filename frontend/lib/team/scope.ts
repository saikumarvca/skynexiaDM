type AuthzContext = {
  perms: string[];
  teamMemberId?: string;
  agencyId?: string;
  agencyKind?: "MAIN_EMPLOYEE" | "PARTNER_EMPLOYEE";
  accountType?: "MAIN_EMPLOYEE" | "PARTNER_AGENCY" | "PARTNER_EMPLOYEE";
  partnerAgencyId?: string;
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

  const isPartnerAccount =
    authz.accountType === "PARTNER_AGENCY" ||
    authz.accountType === "PARTNER_EMPLOYEE" ||
    authz.agencyKind === "PARTNER_EMPLOYEE";
  const effectivePartnerAgencyId = authz.partnerAgencyId ?? authz.agencyId;

  if (!isPartnerAccount) {
    if (!authz.agencyId) return items;
    return items.filter(
      (item) =>
        !item.agencyId ||
        item.agencyId === authz.agencyId ||
        item.assignedPartnerAgencyId === authz.agencyId,
    );
  }

  if (!effectivePartnerAgencyId) return [];
  return items.filter((item) => {
    if (authz.accountType === "PARTNER_EMPLOYEE" && item.assignedToUserId && authz.teamMemberId) {
      return item.assignedToUserId === authz.teamMemberId;
    }
    return item.assignedPartnerAgencyId === effectivePartnerAgencyId;
  });
}

export function canAccessClient(authz: AuthzContext, clientId?: string | null) {
  if (!clientId) return true;
  if (isAdminScope(authz)) return true;
  const assigned = authz.assignedClientIds ?? [];
  if (assigned.length === 0) return true;
  return assigned.includes(clientId);
}

