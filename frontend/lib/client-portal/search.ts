import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import ClientEvent from "@/models/ClientEvent";
import ClientUpdate from "@/models/ClientUpdate";
import { loadClientReviewRows } from "@/lib/client-portal/reviews";
import { CLIENT_REVIEW_STATUS_LABEL } from "@/lib/client-portal/dto";

export type ClientSearchHit = {
  type: "review" | "update" | "activity";
  id: string;
  title: string;
  subtitle: string;
  href: string;
  date: string;
};

export type ClientSearchResult = {
  query: string;
  reviews: ClientSearchHit[];
  updates: ClientSearchHit[];
  activity: ClientSearchHit[];
};

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const LIMIT = 5;

/** Global portal search, restricted to the client's own reviews, updates and activity. */
export async function searchClientPortal(
  clientId: string,
  rawQuery: string,
): Promise<ClientSearchResult> {
  const query = rawQuery.trim().slice(0, 100);
  const empty: ClientSearchResult = { query, reviews: [], updates: [], activity: [] };
  if (query.length < 2) return empty;

  await dbConnect();
  const cid = new mongoose.Types.ObjectId(clientId);
  const rx = new RegExp(escapeRegex(query), "i");
  const q = query.toLowerCase();

  const [{ rows }, updates, events] = await Promise.all([
    loadClientReviewRows(clientId),
    ClientUpdate.find({
      clientId: cid,
      isPublished: true,
      isDeleted: { $ne: true },
      $or: [{ title: rx }, { body: rx }],
    })
      .select("_id title category publishedAt createdAt")
      .sort({ publishedAt: -1 })
      .limit(LIMIT)
      .lean(),
    ClientEvent.find({
      clientId: cid,
      visibility: "CLIENT_VISIBLE",
      $or: [{ title: rx }, { description: rx }, { relatedLabel: rx }],
    })
      .select("_id title description relatedReviewId occurredAt")
      .sort({ occurredAt: -1 })
      .limit(LIMIT)
      .lean(),
  ]);

  const reviews = rows
    .filter((r) =>
      `${r.subject} ${r.customerName ?? ""} ${r.platform ?? ""}`.toLowerCase().includes(q),
    )
    .slice(0, LIMIT)
    .map<ClientSearchHit>((r) => ({
      type: "review",
      id: r.id,
      title: r.subject || "Review",
      subtitle: [r.customerName, r.platform, CLIENT_REVIEW_STATUS_LABEL[r.status]]
        .filter(Boolean)
        .join(" · "),
      href: `/client/reviews/${r.id}`,
      date: r.activityAt.toISOString(),
    }));

  return {
    query,
    reviews,
    updates: updates.map<ClientSearchHit>((u) => ({
      type: "update",
      id: String(u._id),
      title: String(u.title),
      subtitle: String(u.category ?? "").toLowerCase(),
      href: `/client/updates?open=${String(u._id)}`,
      date: new Date((u.publishedAt as Date) ?? (u.createdAt as Date)).toISOString(),
    })),
    activity: events.map<ClientSearchHit>((e) => ({
      type: "activity",
      id: String(e._id),
      title: String(e.title),
      subtitle: String(e.description ?? ""),
      href: e.relatedReviewId ? `/client/reviews/${String(e.relatedReviewId)}` : "/client/change-log",
      date: new Date(e.occurredAt as Date).toISOString(),
    })),
  };
}
