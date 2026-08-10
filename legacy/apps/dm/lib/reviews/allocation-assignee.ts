import TeamMember from "@/models/TeamMember";
import PartnerAgency from "@/models/PartnerAgency";
import { resolveUserHierarchyContext } from "@/lib/team/scope-filters";

type AuthzContext = {
  perms: string[];
  teamMemberId?: string;
  agencyId?: string;
  agencyKind?: "MAIN_EMPLOYEE" | "PARTNER_EMPLOYEE";
  accountType?: "MAIN_EMPLOYEE" | "PARTNER_AGENCY" | "PARTNER_EMPLOYEE";
  partnerAgencyId?: string;
  assignedClientIds?: string[];
};

type AssigneeInput =
  | {
      targetType: "INTERNAL_EMPLOYEE";
      teamMemberId: string;
      teamMemberName: string;
    }
  | {
      targetType: "PARTNER_AGENCY";
      partnerAgencyId: string;
      partnerAgencyName?: string;
    }
  | {
      targetType: "PARTNER_EMPLOYEE";
      partnerAgencyId: string;
      teamMemberId: string;
      teamMemberName: string;
    };

type AllocationPayloadInput = {
  assignee?: AssigneeInput;
  assignedToUserId?: string;
  assignedToUserName?: string;
  assignedPartnerAgencyId?: string;
};

type PersistedAssignee = {
  assigneeType: "MAIN_EMPLOYEE" | "PARTNER_AGENCY" | "PARTNER_EMPLOYEE";
  assigneeTeamMemberId?: string;
  assigneePartnerAgencyId?: string;
  assignedToUserId: string;
  assignedToUserName: string;
  assignedPartnerAgencyId?: string;
};

export function toAssigneeInput(payload: AllocationPayloadInput): AssigneeInput {
  if (payload.assignee) return payload.assignee;
  if (payload.assignedToUserId && payload.assignedToUserName) {
    return {
      targetType: "INTERNAL_EMPLOYEE",
      teamMemberId: payload.assignedToUserId,
      teamMemberName: payload.assignedToUserName,
    };
  }
  throw new Error("ASSIGNEE_REQUIRED");
}

function requireAdminOrAssigner(authz: AuthzContext) {
  const canAssign =
    authz.perms.includes("manage_reviews") || authz.perms.includes("assign_reviews");
  if (!canAssign) throw new Error("FORBIDDEN");
}

async function ensurePartnerAgencyExists(partnerAgencyId: string) {
  const agency = await PartnerAgency.findOne({
    _id: partnerAgencyId,
    isDeleted: { $ne: true },
  })
    .select("_id name")
    .lean();
  if (!agency) throw new Error("PARTNER_AGENCY_NOT_FOUND");
  return {
    id: agency._id.toString(),
    name: agency.name,
  };
}

async function ensureTeamMember(
  teamMemberId: string,
  expectedAccountType?: "MAIN_EMPLOYEE" | "PARTNER_EMPLOYEE" | "PARTNER_AGENCY",
  expectedPartnerAgencyId?: string,
) {
  const member = await TeamMember.findOne({
    _id: teamMemberId,
    isDeleted: { $ne: true },
  })
    .select("_id name accountType partnerAgencyId")
    .lean();
  if (!member) throw new Error("ASSIGNEE_NOT_FOUND");
  const accountType = member.accountType ?? "MAIN_EMPLOYEE";
  if (expectedAccountType && accountType !== expectedAccountType) {
    throw new Error("ASSIGNEE_TYPE_MISMATCH");
  }
  const partnerAgencyId = member.partnerAgencyId
    ? String(member.partnerAgencyId)
    : undefined;
  if (
    expectedPartnerAgencyId &&
    partnerAgencyId &&
    partnerAgencyId !== expectedPartnerAgencyId
  ) {
    throw new Error("ASSIGNEE_AGENCY_MISMATCH");
  }
  if (expectedPartnerAgencyId && !partnerAgencyId) {
    throw new Error("ASSIGNEE_AGENCY_MISMATCH");
  }
  return {
    id: member._id.toString(),
    name: member.name,
    accountType,
    partnerAgencyId,
  };
}

function assertActorScope(authz: AuthzContext, assignee: AssigneeInput) {
  const actor = resolveUserHierarchyContext(authz);
  if (actor.isAdmin) return;

  if (actor.accountType === "PARTNER_AGENCY") {
    if (assignee.targetType !== "PARTNER_EMPLOYEE") {
      throw new Error("FORBIDDEN_SCOPE_ESCALATION");
    }
    if (!actor.partnerAgencyId || assignee.partnerAgencyId !== actor.partnerAgencyId) {
      throw new Error("FORBIDDEN_SCOPE_ESCALATION");
    }
    return;
  }

  if (actor.accountType === "PARTNER_EMPLOYEE") {
    if (assignee.targetType !== "PARTNER_EMPLOYEE") {
      throw new Error("FORBIDDEN_SCOPE_ESCALATION");
    }
    if (!actor.partnerAgencyId || assignee.partnerAgencyId !== actor.partnerAgencyId) {
      throw new Error("FORBIDDEN_SCOPE_ESCALATION");
    }
    if (!actor.teamMemberId || assignee.teamMemberId !== actor.teamMemberId) {
      throw new Error("FORBIDDEN_SCOPE_ESCALATION");
    }
  }
}

export async function resolvePersistedAssignee(
  authz: AuthzContext,
  assignee: AssigneeInput,
): Promise<PersistedAssignee> {
  requireAdminOrAssigner(authz);
  assertActorScope(authz, assignee);

  if (assignee.targetType === "INTERNAL_EMPLOYEE") {
    const member = await ensureTeamMember(assignee.teamMemberId, "MAIN_EMPLOYEE");
    return {
      assigneeType: "MAIN_EMPLOYEE",
      assigneeTeamMemberId: member.id,
      assignedToUserId: member.id,
      assignedToUserName: assignee.teamMemberName || member.name,
    };
  }

  if (assignee.targetType === "PARTNER_AGENCY") {
    const agency = await ensurePartnerAgencyExists(assignee.partnerAgencyId);
    return {
      assigneeType: "PARTNER_AGENCY",
      assigneePartnerAgencyId: agency.id,
      assignedPartnerAgencyId: agency.id,
      assignedToUserId: agency.id,
      assignedToUserName: assignee.partnerAgencyName || agency.name,
    };
  }

  const agency = await ensurePartnerAgencyExists(assignee.partnerAgencyId);
  const member = await ensureTeamMember(
    assignee.teamMemberId,
    "PARTNER_EMPLOYEE",
    agency.id,
  );
  return {
    assigneeType: "PARTNER_EMPLOYEE",
    assigneeTeamMemberId: member.id,
    assigneePartnerAgencyId: agency.id,
    assignedPartnerAgencyId: agency.id,
    assignedToUserId: member.id,
    assignedToUserName: assignee.teamMemberName || member.name,
  };
}
