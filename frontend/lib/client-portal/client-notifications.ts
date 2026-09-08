import mongoose from "mongoose";
import type { ClientContext } from "@/lib/client-portal/session";
import type { ClientNotificationItem } from "@/lib/client-portal/dto";

/**
 * Notifications addressed to this client login. In preview mode the
 * previewing staff member sees the notifications of all logins of the client
 * (read-only), so admins can check what clients receive.
 */
export function clientNotificationFilter(ctx: ClientContext): Record<string, unknown> {
  const base = { clientId: new mongoose.Types.ObjectId(ctx.clientId) };
  return ctx.isPreview ? base : { ...base, userId: ctx.userId };
}

export function toNotificationItem(n: {
  _id: unknown;
  type: string;
  title: string;
  message: string;
  href?: string;
  isRead: boolean;
  createdAt: Date;
}): ClientNotificationItem {
  return {
    id: String(n._id),
    type: n.type,
    title: n.title,
    message: n.message,
    href: n.href ?? null,
    isRead: !!n.isRead,
    createdAt: new Date(n.createdAt).toISOString(),
  };
}
