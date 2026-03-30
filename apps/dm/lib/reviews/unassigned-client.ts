import Client from "@/models/Client";

export const UNASSIGNED_CLIENT_EMAIL = "unassigned.client@system.local";
export const UNASSIGNED_CLIENT_NAME = "Unassigned";

export function isUnassignedClientLike(value: {
  email?: string | null;
  businessName?: string | null;
  name?: string | null;
}) {
  return (
    (value.email ?? "").toLowerCase() === UNASSIGNED_CLIENT_EMAIL ||
    (value.businessName ?? "").trim() === UNASSIGNED_CLIENT_NAME ||
    (value.name ?? "").trim() === UNASSIGNED_CLIENT_NAME
  );
}

export async function getOrCreateUnassignedClient() {
  const existing = await Client.findOne({
    email: { $regex: new RegExp(`^${UNASSIGNED_CLIENT_EMAIL}$`, "i") },
  });
  if (existing) return existing;

  const created = await Client.create({
    name: UNASSIGNED_CLIENT_NAME,
    businessName: UNASSIGNED_CLIENT_NAME,
    brandName: UNASSIGNED_CLIENT_NAME,
    contactName: "System",
    phone: "0000000000",
    email: UNASSIGNED_CLIENT_EMAIL,
    status: "ACTIVE",
    notes: "System generated pseudo client for unassigned review intake",
  });
  return created;
}
