import { cache } from "react";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import Client from "@/models/Client";
import ReviewDraft from "@/models/ReviewDraft";
import ReviewAllocation from "@/models/ReviewAllocation";
import PostedReview from "@/models/PostedReview";

/**
 * Data for the external client portal (role CLIENT). Everything here is
 * scoped to exactly one client id and never exposes internal team details.
 */

export type PortalClient = {
  id: string;
  name: string;
  businessName: string;
  brandName: string;
  status: string;
};

async function loadPortalClient(
  clientId: string | undefined | null,
): Promise<PortalClient | null> {
  if (!clientId || !mongoose.isValidObjectId(clientId)) return null;
  await dbConnect();
  const doc = await Client.findById(clientId)
    .select("name businessName brandName status")
    .lean();
  if (!doc) return null;
  return {
    id: String(doc._id),
    name: String(doc.name ?? ""),
    businessName: String(doc.businessName ?? doc.name ?? ""),
    brandName: String(doc.brandName ?? ""),
    status: String(doc.status ?? "ACTIVE"),
  };
}

/** Per-request cached client lookup shared by the portal layout and pages. */
export const getPortalClient = cache(loadPortalClient);

export type ClientReviewSummary = {
  /** Drafts written for the client (excluding archived). */
  drafts: number;
  /** Allocations the team is still working on (assigned, not yet shared). */
  inProgress: number;
  /** Allocations shared with a customer and awaiting posting. */
  awaitingPosting: number;
  /** Allocations posted or marked used. */
  posted: number;
  postedLast7Days: number;
  postedPrevious7Days: number;
  platforms: { platform: string; count: number }[];
  recentPosted: {
    id: string;
    postedDate: string;
    platform: string;
    postedByName: string;
    reviewLink?: string;
    subject?: string;
  }[];
};

const DAY_MS = 24 * 60 * 60 * 1000;

export async function getClientReviewSummary(
  clientId: string,
): Promise<ClientReviewSummary> {
  await dbConnect();
  const cid = new mongoose.Types.ObjectId(clientId);

  const draftDocs = await ReviewDraft.find({ clientId: cid })
    .select("_id status")
    .lean();
  const draftIds = draftDocs.map((d) => d._id as mongoose.Types.ObjectId);
  const drafts = draftDocs.filter((d) => d.status !== "Archived").length;

  if (draftIds.length === 0) {
    return {
      drafts,
      inProgress: 0,
      awaitingPosting: 0,
      posted: 0,
      postedLast7Days: 0,
      postedPrevious7Days: 0,
      platforms: [],
      recentPosted: [],
    };
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * DAY_MS);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * DAY_MS);

  const [statusRows, platformRows, postedLast7Days, postedPrevious7Days, recent] =
    await Promise.all([
      ReviewAllocation.aggregate<{ _id: string; count: number }>([
        { $match: { draftId: { $in: draftIds } } },
        { $group: { _id: "$allocationStatus", count: { $sum: 1 } } },
      ]),
      PostedReview.aggregate<{ _id: string | null; count: number }>([
        { $match: { draftId: { $in: draftIds } } },
        { $group: { _id: "$platform", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      PostedReview.countDocuments({
        draftId: { $in: draftIds },
        postedDate: { $gte: sevenDaysAgo, $lte: now },
      }),
      PostedReview.countDocuments({
        draftId: { $in: draftIds },
        postedDate: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo },
      }),
      PostedReview.find({ draftId: { $in: draftIds } })
        .select("postedDate platform postedByName reviewLink draftId")
        .populate("draftId", "subject")
        .sort({ postedDate: -1 })
        .limit(20)
        .lean(),
    ]);

  const byStatus: Record<string, number> = {};
  for (const r of statusRows) byStatus[r._id] = r.count;

  return {
    drafts,
    inProgress: byStatus["Assigned"] ?? 0,
    awaitingPosting: byStatus["Shared with Customer"] ?? 0,
    posted: (byStatus["Posted"] ?? 0) + (byStatus["Used"] ?? 0),
    postedLast7Days,
    postedPrevious7Days,
    platforms: platformRows.map((p) => ({
      platform: p._id?.trim() || "Other",
      count: p.count,
    })),
    recentPosted: recent.map((p) => {
      const draft = p.draftId as { subject?: string } | null;
      return {
        id: String(p._id),
        postedDate: new Date(p.postedDate).toISOString(),
        platform: String(p.platform ?? ""),
        postedByName: String(p.postedByName ?? ""),
        reviewLink: p.reviewLink ? String(p.reviewLink) : undefined,
        subject: draft?.subject ? String(draft.subject) : undefined,
      };
    }),
  };
}
