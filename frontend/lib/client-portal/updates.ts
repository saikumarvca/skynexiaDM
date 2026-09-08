import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import ClientUpdate, { type ClientUpdateCategory } from "@/models/ClientUpdate";
import type { ClientEventCategory } from "@/models/ClientEvent";
import { recordClientEvent } from "@/lib/client-portal/events";
import { recordClientPortalAudit } from "@/lib/client-portal/audit";
import { resolveActorForSessionUser } from "@/lib/client-portal/actors";
import type { SessionUser } from "@/lib/auth";
import type { ClientContext } from "@/lib/client-portal/session";
import { paginate, type ClientUpdateItem, type Paginated } from "@/lib/client-portal/dto";

export const CLIENT_UPDATE_CATEGORIES: ClientUpdateCategory[] = [
  "ANNOUNCEMENT",
  "PROGRESS",
  "FEATURE",
  "MAINTENANCE",
  "REPORTING",
];

const EVENT_CATEGORY_FOR_UPDATE: Record<ClientUpdateCategory, ClientEventCategory> = {
  ANNOUNCEMENT: "FEATURE",
  PROGRESS: "REVIEW",
  FEATURE: "FEATURE",
  MAINTENANCE: "SYSTEM",
  REPORTING: "SYSTEM",
};

type UpdateLean = {
  _id: mongoose.Types.ObjectId;
  title: string;
  body: string;
  category: ClientUpdateCategory;
  postedByName: string;
  postedByRole: ClientUpdateItem["postedByRole"];
  relatedReviewId?: mongoose.Types.ObjectId | null;
  relatedLabel?: string;
  linkUrl?: string;
  linkLabel?: string;
  publishedAt?: Date | null;
  createdAt: Date;
  readByUserIds?: string[];
  isPublished?: boolean;
  isDeleted?: boolean;
};

function toItem(u: UpdateLean, readerUserId: string): ClientUpdateItem {
  return {
    id: String(u._id),
    title: u.title,
    body: u.body,
    category: u.category,
    postedByName: u.postedByName,
    postedByRole: u.postedByRole,
    relatedReviewId: u.relatedReviewId ? String(u.relatedReviewId) : null,
    relatedLabel: u.relatedLabel ?? null,
    linkUrl: u.linkUrl ?? null,
    linkLabel: u.linkLabel ?? null,
    publishedAt: new Date(u.publishedAt ?? u.createdAt).toISOString(),
    isRead: (u.readByUserIds ?? []).includes(readerUserId),
  };
}

function publishedFilter(clientId: string) {
  return {
    clientId: new mongoose.Types.ObjectId(clientId),
    isPublished: true,
    isDeleted: { $ne: true },
  };
}

// ─── Client side ─────────────────────────────────────────────────────────────

export async function listClientUpdates(
  ctx: ClientContext,
  q: { page: number; pageSize: number; unreadOnly?: boolean },
): Promise<Paginated<ClientUpdateItem> & { unread: number }> {
  await dbConnect();
  const filter: Record<string, unknown> = publishedFilter(ctx.clientId);
  if (q.unreadOnly) filter.readByUserIds = { $ne: ctx.userId };
  const [total, docs, unread] = await Promise.all([
    ClientUpdate.countDocuments(filter),
    ClientUpdate.find(filter)
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip((q.page - 1) * q.pageSize)
      .limit(q.pageSize)
      .lean() as unknown as Promise<UpdateLean[]>,
    ClientUpdate.countDocuments({
      ...publishedFilter(ctx.clientId),
      readByUserIds: { $ne: ctx.userId },
    }),
  ]);
  return {
    ...paginate(docs.map((d) => toItem(d, ctx.userId)), q.page, q.pageSize, total),
    unread,
  };
}

export async function getClientUpdate(
  ctx: ClientContext,
  id: string,
): Promise<ClientUpdateItem | null> {
  if (!mongoose.isValidObjectId(id)) return null;
  await dbConnect();
  const doc = (await ClientUpdate.findOne({
    _id: new mongoose.Types.ObjectId(id),
    ...publishedFilter(ctx.clientId),
  }).lean()) as unknown as UpdateLean | null;
  return doc ? toItem(doc, ctx.userId) : null;
}

export async function markClientUpdateRead(
  ctx: ClientContext,
  id: string,
): Promise<ClientUpdateItem | null> {
  if (!mongoose.isValidObjectId(id)) return null;
  await dbConnect();
  const doc = (await ClientUpdate.findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(id), ...publishedFilter(ctx.clientId) },
    { $addToSet: { readByUserIds: ctx.userId } },
    { new: true },
  ).lean()) as unknown as UpdateLean | null;
  return doc ? toItem(doc, ctx.userId) : null;
}

// ─── Internal (admin/staff) side ─────────────────────────────────────────────

export type AdminClientUpdate = ClientUpdateItem & {
  isPublished: boolean;
  createdAt: string;
  readCount: number;
};

function toAdminItem(u: UpdateLean): AdminClientUpdate {
  return {
    ...toItem(u, ""),
    isRead: false,
    isPublished: u.isPublished !== false,
    createdAt: new Date(u.createdAt).toISOString(),
    readCount: (u.readByUserIds ?? []).length,
  };
}

export async function listClientUpdatesForStaff(
  clientId: string,
  q: { page: number; pageSize: number },
): Promise<Paginated<AdminClientUpdate>> {
  await dbConnect();
  const filter = {
    clientId: new mongoose.Types.ObjectId(clientId),
    isDeleted: { $ne: true },
  };
  const [total, docs] = await Promise.all([
    ClientUpdate.countDocuments(filter),
    ClientUpdate.find(filter)
      .sort({ createdAt: -1 })
      .skip((q.page - 1) * q.pageSize)
      .limit(q.pageSize)
      .lean() as unknown as Promise<UpdateLean[]>,
  ]);
  return paginate(docs.map(toAdminItem), q.page, q.pageSize, total);
}

export type ClientUpdateInput = {
  title: string;
  body: string;
  category: ClientUpdateCategory;
  isPublished: boolean;
  relatedReviewId?: string | null;
  relatedLabel?: string | null;
  linkUrl?: string | null;
  linkLabel?: string | null;
};

export async function createClientUpdate(
  clientId: string,
  actor: SessionUser,
  input: ClientUpdateInput,
): Promise<AdminClientUpdate> {
  await dbConnect();
  const resolved = await resolveActorForSessionUser(actor);
  const now = new Date();
  const doc = await ClientUpdate.create({
    clientId: new mongoose.Types.ObjectId(clientId),
    title: input.title,
    body: input.body,
    category: input.category,
    postedByUserId: actor.userId,
    postedByName: actor.name,
    postedByRole: resolved.actorRole,
    relatedReviewId:
      input.relatedReviewId && mongoose.isValidObjectId(input.relatedReviewId)
        ? new mongoose.Types.ObjectId(input.relatedReviewId)
        : null,
    relatedLabel: input.relatedLabel || undefined,
    linkUrl: input.linkUrl || undefined,
    linkLabel: input.linkLabel || undefined,
    isPublished: input.isPublished,
    publishedAt: input.isPublished ? now : null,
  });

  if (input.isPublished) {
    await announcePublished(clientId, doc._id.toString(), input, actor, resolved.actorRole);
  }
  await recordClientPortalAudit({
    action: "CLIENT_UPDATE_PUBLISHED",
    actor: { userId: actor.userId, name: actor.name },
    clientId,
    targetName: input.title,
    details: { updateId: doc._id.toString(), isPublished: input.isPublished },
  });
  return toAdminItem(doc.toObject() as unknown as UpdateLean);
}

async function announcePublished(
  clientId: string,
  updateId: string,
  input: Pick<ClientUpdateInput, "title" | "body" | "category" | "relatedReviewId" | "relatedLabel">,
  actor: SessionUser,
  actorRole: AdminClientUpdate["postedByRole"],
) {
  const summary = input.body.length > 160 ? `${input.body.slice(0, 157)}…` : input.body;
  await recordClientEvent({
    clientId,
    entityType: input.category === "PROGRESS" ? "REVIEW" : "FEATURE",
    entityId: updateId,
    action: "UPDATE_PUBLISHED",
    title: input.title,
    description: summary,
    actorUserId: actor.userId,
    actorName: actor.name,
    actorRole,
    visibility: "CLIENT_VISIBLE",
    category: EVENT_CATEGORY_FOR_UPDATE[input.category],
    source: "CLIENT_UPDATE",
    relatedReviewId: input.relatedReviewId ?? null,
    relatedLabel: input.relatedLabel ?? undefined,
    metadata: { updateId },
    notify: {
      type: "CLIENT_UPDATE",
      title: input.title,
      message: summary,
      href: `/client/updates?open=${updateId}`,
    },
  });
}

export async function updateClientUpdate(
  clientId: string,
  updateId: string,
  actor: SessionUser,
  patch: Partial<ClientUpdateInput>,
): Promise<AdminClientUpdate | null> {
  if (!mongoose.isValidObjectId(updateId)) return null;
  await dbConnect();
  const existing = (await ClientUpdate.findOne({
    _id: new mongoose.Types.ObjectId(updateId),
    clientId: new mongoose.Types.ObjectId(clientId),
    isDeleted: { $ne: true },
  }).lean()) as unknown as UpdateLean | null;
  if (!existing) return null;

  const set: Record<string, unknown> = {};
  if (patch.title !== undefined) set.title = patch.title;
  if (patch.body !== undefined) set.body = patch.body;
  if (patch.category !== undefined) set.category = patch.category;
  if (patch.relatedReviewId !== undefined) {
    set.relatedReviewId =
      patch.relatedReviewId && mongoose.isValidObjectId(patch.relatedReviewId)
        ? new mongoose.Types.ObjectId(patch.relatedReviewId)
        : null;
  }
  if (patch.relatedLabel !== undefined) set.relatedLabel = patch.relatedLabel || undefined;
  if (patch.linkUrl !== undefined) set.linkUrl = patch.linkUrl || undefined;
  if (patch.linkLabel !== undefined) set.linkLabel = patch.linkLabel || undefined;

  const becomesPublished = patch.isPublished === true && existing.isPublished === false;
  if (patch.isPublished !== undefined) {
    set.isPublished = patch.isPublished;
    if (becomesPublished) set.publishedAt = new Date();
  }

  const doc = (await ClientUpdate.findByIdAndUpdate(existing._id, { $set: set }, { new: true })
    .lean()) as unknown as UpdateLean | null;
  if (!doc) return null;

  if (becomesPublished) {
    const resolved = await resolveActorForSessionUser(actor);
    await announcePublished(
      clientId,
      String(doc._id),
      {
        title: doc.title,
        body: doc.body,
        category: doc.category,
        relatedReviewId: doc.relatedReviewId ? String(doc.relatedReviewId) : null,
        relatedLabel: doc.relatedLabel ?? null,
      },
      actor,
      resolved.actorRole,
    );
  }
  await recordClientPortalAudit({
    action: "CLIENT_UPDATE_CHANGED",
    actor: { userId: actor.userId, name: actor.name },
    clientId,
    targetName: doc.title,
    details: { updateId: String(doc._id), changed: Object.keys(set) },
  });
  return toAdminItem(doc);
}

export async function deleteClientUpdate(
  clientId: string,
  updateId: string,
  actor: SessionUser,
): Promise<boolean> {
  if (!mongoose.isValidObjectId(updateId)) return false;
  await dbConnect();
  const doc = await ClientUpdate.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(updateId),
      clientId: new mongoose.Types.ObjectId(clientId),
      isDeleted: { $ne: true },
    },
    { $set: { isDeleted: true, deletedAt: new Date(), isPublished: false } },
    { new: true },
  ).lean();
  if (!doc) return false;
  await recordClientPortalAudit({
    action: "CLIENT_UPDATE_REMOVED",
    actor: { userId: actor.userId, name: actor.name },
    clientId,
    targetName: String(doc.title),
    details: { updateId },
  });
  return true;
}
