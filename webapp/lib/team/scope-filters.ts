type AccountType = "MAIN_EMPLOYEE" | "PARTNER_AGENCY" | "PARTNER_EMPLOYEE";

type PermissionAuthz = {
  perms: string[];
  teamMemberId?: string;
  agencyId?: string;
  agencyKind?: "MAIN_EMPLOYEE" | "PARTNER_EMPLOYEE";
  accountType?: AccountType;
  partnerAgencyId?: string;
  assignedClientIds?: string[];
};

type MongoFilter = Record<string, unknown>;

export type UserHierarchyContext = {
  isAdmin: boolean;
  accountType: AccountType;
  teamMemberId?: string;
  agencyId?: string;
  partnerAgencyId?: string;
  assignedClientIds: string[];
};

function toNonEmptyStrings(values?: string[]) {
  if (!Array.isArray(values)) return [];
  return values.filter((value): value is string => typeof value === "string" && value.length > 0);
}

function isPartnerAccount(ctx: UserHierarchyContext) {
  return ctx.accountType === "PARTNER_AGENCY" || ctx.accountType === "PARTNER_EMPLOYEE";
}

export function andFilters(...filters: Array<MongoFilter | null | undefined>): MongoFilter {
  const validFilters = filters.filter(
    (filter): filter is MongoFilter => !!filter && Object.keys(filter).length > 0,
  );
  if (validFilters.length === 0) return {};
  if (validFilters.length === 1) return validFilters[0] ?? {};
  return { $and: validFilters };
}

export function resolveUserHierarchyContext(authz: PermissionAuthz): UserHierarchyContext {
  const isAdmin = authz.perms.includes("manage_settings");
  const accountType = authz.accountType ?? "MAIN_EMPLOYEE";
  const partnerAgencyId =
    authz.partnerAgencyId ??
    (accountType === "PARTNER_AGENCY" || accountType === "PARTNER_EMPLOYEE" || authz.agencyKind === "PARTNER_EMPLOYEE"
      ? authz.agencyId
      : undefined);

  return {
    isAdmin,
    accountType,
    teamMemberId: authz.teamMemberId,
    agencyId: authz.agencyId,
    partnerAgencyId,
    assignedClientIds: toNonEmptyStrings(authz.assignedClientIds),
  };
}

export function buildClientScopeFilter(ctx: UserHierarchyContext): MongoFilter {
  if (ctx.isAdmin) return {};

  if (ctx.accountType === "PARTNER_EMPLOYEE") {
    if (!ctx.partnerAgencyId) return { _id: { $in: [] } };
    return { assignedPartnerAgencyId: ctx.partnerAgencyId };
  }

  if (ctx.accountType === "PARTNER_AGENCY") {
    if (!ctx.partnerAgencyId) return { _id: { $in: [] } };
    return { assignedPartnerAgencyId: ctx.partnerAgencyId };
  }

  if (ctx.assignedClientIds.length > 0) {
    return { _id: { $in: ctx.assignedClientIds } };
  }

  return {};
}

export function buildReviewScopeFilter(
  ctx: UserHierarchyContext,
  options?: {
    assignedToUserIdField?: string;
    assignedPartnerAgencyIdField?: string;
    clientIdField?: string;
    workerOnly?: boolean;
  },
): MongoFilter {
  if (ctx.isAdmin) return {};

  const assignedToUserIdField = options?.assignedToUserIdField ?? "assignedToUserId";
  const assignedPartnerAgencyIdField = options?.assignedPartnerAgencyIdField ?? "assignedPartnerAgencyId";
  const clientIdField = options?.clientIdField ?? "clientId";
  const filters: MongoFilter[] = [];

  if (isPartnerAccount(ctx)) {
    if (!ctx.partnerAgencyId) return { _id: { $in: [] } };
    filters.push({ [assignedPartnerAgencyIdField]: ctx.partnerAgencyId });
  }

  if (ctx.accountType === "PARTNER_EMPLOYEE" || options?.workerOnly) {
    if (!ctx.teamMemberId) return { _id: { $in: [] } };
    filters.push({ [assignedToUserIdField]: ctx.teamMemberId });
  }

  if (!isPartnerAccount(ctx) && ctx.assignedClientIds.length > 0) {
    filters.push({ [clientIdField]: { $in: ctx.assignedClientIds } });
  }

  return andFilters(...filters);
}

export function buildTaskScopeFilter(
  ctx: UserHierarchyContext,
  options?: {
    assignedToUserIdField?: string;
    assignedToField?: string;
    assignedPartnerAgencyIdField?: string;
    clientIdField?: string;
    workerOnly?: boolean;
  },
): MongoFilter {
  if (ctx.isAdmin) return {};

  const assignedToUserIdField = options?.assignedToUserIdField ?? "assignedToUserId";
  const assignedToField = options?.assignedToField ?? "assignedTo";
  const assignedPartnerAgencyIdField = options?.assignedPartnerAgencyIdField ?? "assignedPartnerAgencyId";
  const clientIdField = options?.clientIdField ?? "clientId";
  const filters: MongoFilter[] = [];

  if (isPartnerAccount(ctx)) {
    if (!ctx.partnerAgencyId) return { _id: { $in: [] } };
    filters.push({ [assignedPartnerAgencyIdField]: ctx.partnerAgencyId });
  }

  if (ctx.accountType === "PARTNER_EMPLOYEE" || options?.workerOnly) {
    if (!ctx.teamMemberId) return { _id: { $in: [] } };
    filters.push({
      $or: [{ [assignedToField]: ctx.teamMemberId }, { [assignedToUserIdField]: ctx.teamMemberId }],
    });
  }

  if (!isPartnerAccount(ctx) && ctx.assignedClientIds.length > 0) {
    filters.push({ [clientIdField]: { $in: ctx.assignedClientIds } });
  }

  return andFilters(...filters);
}

export function buildTeamScopeFilter(
  ctx: UserHierarchyContext,
  options?: {
    partnerAgencyField?: string;
    agencyField?: string;
    teamMemberIdField?: string;
    ownOnly?: boolean;
  },
): MongoFilter {
  if (ctx.isAdmin) return {};

  const partnerAgencyField = options?.partnerAgencyField ?? "partnerAgencyId";
  const agencyField = options?.agencyField ?? "agencyId";
  const teamMemberIdField = options?.teamMemberIdField ?? "_id";

  if (ctx.accountType === "PARTNER_AGENCY" || ctx.accountType === "PARTNER_EMPLOYEE") {
    if (!ctx.partnerAgencyId) return { _id: { $in: [] } };
    const partnerFilter: MongoFilter = { [partnerAgencyField]: ctx.partnerAgencyId };
    if (ctx.accountType === "PARTNER_EMPLOYEE" || options?.ownOnly) {
      if (!ctx.teamMemberId) return { _id: { $in: [] } };
      return andFilters(partnerFilter, { [teamMemberIdField]: ctx.teamMemberId });
    }
    return partnerFilter;
  }

  if (options?.ownOnly) {
    if (!ctx.teamMemberId) return { _id: { $in: [] } };
    return { [teamMemberIdField]: ctx.teamMemberId };
  }

  if (ctx.agencyId) {
    return { [agencyField]: ctx.agencyId };
  }

  return {};
}
