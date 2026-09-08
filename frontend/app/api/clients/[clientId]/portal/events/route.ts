import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import ClientEvent from "@/models/ClientEvent";
import { requireClientPortalStaff } from "@/lib/client-portal/staff-access";
import { toActivityItem } from "@/lib/client-portal/analytics";
import { clampPage, clampPageSize, paginate } from "@/lib/client-portal/dto";

interface RouteParams {
  params: Promise<{ clientId: string }>;
}

/**
 * GET /api/clients/[clientId]/portal/events?visibility=ALL|CLIENT_VISIBLE|INTERNAL&page=&pageSize=
 * Staff view of the client's event feed, including internal-only rows, so the
 * visibility of each entry can be reviewed and changed.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { clientId } = await params;
  const access = await requireClientPortalStaff(request, clientId);
  if (access.denied) return access.denied;

  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const visibility = searchParams.get("visibility")?.toUpperCase() ?? "ALL";
    const page = clampPage(searchParams.get("page"));
    const pageSize = clampPageSize(searchParams.get("pageSize"), 25);

    const filter: Record<string, unknown> = {
      clientId: new mongoose.Types.ObjectId(access.clientId),
    };
    if (visibility === "CLIENT_VISIBLE" || visibility === "INTERNAL") {
      filter.visibility = visibility;
    }

    const [total, events] = await Promise.all([
      ClientEvent.countDocuments(filter),
      ClientEvent.find(filter)
        .sort({ occurredAt: -1, _id: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
    ]);
    return NextResponse.json(
      paginate(
        events.map((e) => ({
          ...toActivityItem(e as Parameters<typeof toActivityItem>[0]),
          visibility: e.visibility,
          source: e.source,
        })),
        page,
        pageSize,
        total,
      ),
    );
  } catch (error) {
    console.error("Error listing client events:", error);
    return NextResponse.json({ error: "Failed to load events" }, { status: 500 });
  }
}
