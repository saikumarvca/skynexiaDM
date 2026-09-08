import { NextResponse, type NextRequest } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import Client from "@/models/Client";
import { requireUserFromRequest, type SessionUser } from "@/lib/auth";
import { requireAnyPermissionApi } from "@/lib/team/require-permission-api";
import { isUnassignedClientLike } from "@/lib/reviews/unassigned-client";

/**
 * Authorisation for the internal "Client Portal" management APIs
 * (/api/clients/[clientId]/portal/*): platform admins, or team members whose
 * role grants `manage_clients`. CLIENT logins are always refused.
 */
export type StaffAccess =
  | { user: SessionUser; clientId: string; clientName: string; denied: null }
  | { user: null; clientId: null; clientName: null; denied: NextResponse };

export async function requireClientPortalStaff(
  req: NextRequest,
  clientId: string,
): Promise<StaffAccess> {
  const deny = (status: number, error: string): StaffAccess => ({
    user: null,
    clientId: null,
    clientName: null,
    denied: NextResponse.json({ error }, { status }),
  });

  let user: SessionUser;
  try {
    user = await requireUserFromRequest(req);
  } catch {
    return deny(401, "Unauthorized");
  }
  if (user.role === "CLIENT") return deny(403, "Forbidden");

  if (user.role !== "ADMIN") {
    const authz = await requireAnyPermissionApi(req, ["manage_clients"]);
    if (authz.denied) return deny(403, "Forbidden: manage_clients required");
  }

  if (!mongoose.isValidObjectId(clientId)) return deny(404, "Client not found");
  await dbConnect();
  const client = await Client.findById(clientId)
    .select("_id name businessName email")
    .lean();
  if (!client || isUnassignedClientLike(client)) return deny(404, "Client not found");

  return {
    user,
    clientId: String(client._id),
    clientName: String(client.businessName ?? client.name ?? ""),
    denied: null,
  };
}
