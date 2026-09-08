import { cache } from "react";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import Client from "@/models/Client";

/** The few client fields the portal is allowed to show. */
export type PortalClient = {
  id: string;
  name: string;
  businessName: string;
  brandName: string;
  contactName: string;
  email: string;
  phone: string;
  website?: string;
  industry?: string;
  location?: string;
  status: string;
  createdAt: string;
};

export async function loadPortalClient(
  clientId: string | undefined | null,
): Promise<PortalClient | null> {
  if (!clientId || !mongoose.isValidObjectId(clientId)) return null;
  await dbConnect();
  const doc = await Client.findById(clientId)
    .select(
      "name businessName brandName contactName email phone website industry location status createdAt",
    )
    .lean();
  if (!doc) return null;
  return {
    id: String(doc._id),
    name: String(doc.name ?? ""),
    businessName: String(doc.businessName ?? doc.name ?? ""),
    brandName: String(doc.brandName ?? doc.businessName ?? doc.name ?? ""),
    contactName: String(doc.contactName ?? ""),
    email: String(doc.email ?? ""),
    phone: String(doc.phone ?? ""),
    website: doc.website ? String(doc.website) : undefined,
    industry: doc.industry ? String(doc.industry) : undefined,
    location: doc.location ? String(doc.location) : undefined,
    status: String(doc.status ?? "ACTIVE"),
    createdAt: doc.createdAt
      ? new Date(doc.createdAt as Date).toISOString()
      : new Date(0).toISOString(),
  };
}

/** Per-request cached client lookup shared by the portal layout and pages. */
export const getPortalClient = cache(loadPortalClient);
