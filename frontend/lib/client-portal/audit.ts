import dbConnect from "@/lib/mongodb";
import TeamActivityLog from "@/models/TeamActivityLog";

export type ClientPortalAuditAction =
  | "CLIENT_LOGIN"
  | "CLIENT_PASSWORD_CHANGED"
  | "CLIENT_PORTAL_PREVIEW_STARTED"
  | "CLIENT_PORTAL_PREVIEW_ENDED"
  | "CLIENT_UPDATE_PUBLISHED"
  | "CLIENT_UPDATE_CHANGED"
  | "CLIENT_UPDATE_REMOVED"
  | "CLIENT_EVENT_VISIBILITY_CHANGED";

/**
 * Security-relevant client-portal actions go to the internal admin audit log
 * (TeamActivityLog, module "client-portal"). They are deliberately kept out of
 * the client-facing change log.
 */
export async function recordClientPortalAudit(params: {
  action: ClientPortalAuditAction;
  actor: { userId: string; name: string };
  clientId: string;
  targetName?: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  try {
    await dbConnect();
    await TeamActivityLog.create({
      userId: params.actor.userId,
      userName: params.actor.name,
      action: params.action,
      module: "client-portal",
      entityType: "Client",
      entityId: params.clientId,
      targetName: params.targetName,
      details: params.details,
    });
  } catch (error) {
    console.error("Failed to record client portal audit entry:", error);
  }
}
