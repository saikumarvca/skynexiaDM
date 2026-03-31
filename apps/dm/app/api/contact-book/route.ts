import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import { requireUserFromRequest } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import ContactBookEntry from "@/models/ContactBookEntry";
import User from "@/models/User";
import {
  contactBookCreateSchema,
} from "@/lib/api/schemas";
import { parseWithSchema, apiError } from "@/lib/api/validation";
import { normalizeContactTags } from "@/lib/contact-book-tags";

export async function GET(request: NextRequest) {
  const denied = await requireSessionApi(request);
  if (denied) return denied;

  try {
    const user = await requireUserFromRequest(request);
    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") ?? "").trim();
    const tagsRaw = searchParams.get("tags");
    const ownerFilter = (searchParams.get("ownerUserId") ?? "").trim();

    const query: Record<string, unknown> = {};

    if (user.role === "ADMIN") {
      if (ownerFilter) query.ownerUserId = ownerFilter;
    } else {
      query.ownerUserId = user.userId;
    }

    if (tagsRaw) {
      const tagList = normalizeContactTags(
        tagsRaw.split(",").map((t) => t.trim()).filter(Boolean),
      );
      if (tagList.length > 0) {
        const matchAll =
          (searchParams.get("tagMatch") ?? "any").toLowerCase() === "all";
        query.tags = matchAll ? { $all: tagList } : { $in: tagList };
      }
    }

    if (search) {
      const rx = new RegExp(
        search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i",
      );
      query.$or = [
        { displayName: rx },
        { phone: rx },
        { email: rx },
        { notes: rx },
      ];
    }

    await dbConnect();
    const rows = await ContactBookEntry.find(query)
      .sort({ updatedAt: -1 })
      .lean();

    const ownerIds = [...new Set(rows.map((r) => String(r.ownerUserId)))];
    const owners =
      user.role === "ADMIN" && ownerIds.length > 0
        ? await User.find({ _id: { $in: ownerIds } })
            .select("_id name email")
            .lean()
        : [];
    const ownerMap = new Map(
      owners.map((o) => [
        String(o._id),
        { name: o.name as string, email: o.email as string },
      ]),
    );

    const payload = rows.map((r) => {
      const id = String(r._id);
      const oid = String(r.ownerUserId);
      const o = ownerMap.get(oid);
      return {
        _id: id,
        ownerUserId: oid,
        ownerName: o?.name,
        ownerEmail: o?.email,
        displayName: r.displayName,
        phone: r.phone ?? undefined,
        email: r.email ?? undefined,
        notes: r.notes ?? undefined,
        tags: Array.isArray(r.tags) ? r.tags : [],
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      };
    });

    return NextResponse.json(payload);
  } catch (error) {
    console.error("GET /api/contact-book:", error);
    return NextResponse.json(
      { error: "Failed to load contacts" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const denied = await requireSessionApi(request);
  if (denied) return denied;

  const parsed = await parseWithSchema(request, contactBookCreateSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const user = await requireUserFromRequest(request);
    const body = parsed.data;
    const tags = normalizeContactTags(body.tags);

    await dbConnect();
    const doc = await ContactBookEntry.create({
      ownerUserId: user.userId,
      displayName: body.displayName,
      phone: body.phone,
      email: body.email,
      notes: body.notes,
      tags,
    });

    const plain = doc.toObject();
    return NextResponse.json(
      {
        _id: String(plain._id),
        ownerUserId: plain.ownerUserId,
        displayName: plain.displayName,
        phone: plain.phone,
        email: plain.email,
        notes: plain.notes,
        tags: plain.tags ?? [],
        createdAt: plain.createdAt,
        updatedAt: plain.updatedAt,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/contact-book:", error);
    return apiError(500, "Failed to create contact");
  }
}
