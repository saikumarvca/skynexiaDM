import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Notification from "@/models/Notification";
import { requireClientSessionApi } from "@/lib/client-portal/session";
import {
  clientNotificationFilter,
  toNotificationItem,
} from "@/lib/client-portal/client-notifications";
import { clampPage, clampPageSize, paginate } from "@/lib/client-portal/dto";

/** GET /api/client/notifications?page=&pageSize=&unreadOnly=true */
export async function GET(request: NextRequest) {
  const auth = await requireClientSessionApi(request);
  if (auth.denied) return auth.denied;

  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const page = clampPage(searchParams.get("page"));
    const pageSize = clampPageSize(searchParams.get("pageSize"));
    const filter = clientNotificationFilter(auth.ctx);
    if (searchParams.get("unreadOnly") === "true") filter.isRead = false;

    const [total, docs] = await Promise.all([
      Notification.countDocuments(filter),
      Notification.find(filter)
        .select("_id type title message href isRead createdAt")
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
    ]);
    return NextResponse.json(
      paginate(
        docs.map((d) => toNotificationItem(d as Parameters<typeof toNotificationItem>[0])),
        page,
        pageSize,
        total,
      ),
    );
  } catch (error) {
    console.error("Error loading client notifications:", error);
    return NextResponse.json({ error: "Failed to load notifications" }, { status: 500 });
  }
}
