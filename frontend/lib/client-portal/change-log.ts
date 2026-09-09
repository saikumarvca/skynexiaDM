import "server-only";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import ClientEvent, {
  type ClientEventActorRole,
  type ClientEventCategory,
} from "@/models/ClientEvent";
import { toActivityItem } from "@/lib/client-portal/analytics";
import {
  CHANGE_LOG_CATEGORIES,
  CHANGE_LOG_ROLES,
  paginate,
  type ClientActivityItem,
  type Paginated,
} from "@/lib/client-portal/dto";

export type ChangeLogQuery = {
  category?: string | null;
  role?: string | null;
  from?: Date | null;
  to?: Date | null;
  search?: string | null;
  page: number;
  pageSize: number;
};

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Client-visible change log, newest first, server-side paginated. */
export async function getClientChangeLog(
  clientId: string,
  q: ChangeLogQuery,
): Promise<Paginated<ClientActivityItem>> {
  await dbConnect();
  const filter: Record<string, unknown> = {
    clientId: new mongoose.Types.ObjectId(clientId),
    visibility: "CLIENT_VISIBLE",
  };
  if (q.category && CHANGE_LOG_CATEGORIES.includes(q.category as ClientEventCategory)) {
    filter.category = q.category;
  }
  if (q.role && CHANGE_LOG_ROLES.includes(q.role as ClientEventActorRole)) {
    filter.actorRole = q.role;
  }
  if (q.from || q.to) {
    const occurredAt: Record<string, Date> = {};
    if (q.from) occurredAt.$gte = q.from;
    if (q.to) occurredAt.$lte = q.to;
    filter.occurredAt = occurredAt;
  }
  const search = (q.search ?? "").trim();
  if (search) {
    const rx = new RegExp(escapeRegex(search).slice(0, 200), "i");
    filter.$or = [
      { title: rx },
      { description: rx },
      { relatedLabel: rx },
      { actorName: rx },
    ];
  }

  const [total, events] = await Promise.all([
    ClientEvent.countDocuments(filter),
    ClientEvent.find(filter)
      .select("_id entityType action title description actorName actorRole category relatedReviewId relatedLabel occurredAt")
      .sort({ occurredAt: -1, _id: -1 })
      .skip((q.page - 1) * q.pageSize)
      .limit(q.pageSize)
      .lean(),
  ]);

  return paginate(
    events.map((e) => toActivityItem(e as Parameters<typeof toActivityItem>[0])),
    q.page,
    q.pageSize,
    total,
  );
}
