import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import ItemMaster from "@/models/ItemMaster";

export async function GET(request: NextRequest) {
  const denied = await requireSessionApi(request);
  if (denied) return denied;
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";
    const q: Record<string, unknown> = {};
    if (!includeInactive) q.isActive = true;
    const items = await ItemMaster.find(q).sort({ name: 1 }).lean();
    return NextResponse.json(JSON.parse(JSON.stringify(items)));
  } catch (error) {
    console.error("Error fetching item master:", error);
    return NextResponse.json(
      { error: "Failed to fetch items" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const denied = await requireSessionApi(request);
  if (denied) return denied;
  try {
    await dbConnect();
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const description = String(body.description ?? "").trim();
    const defaultUnitPrice = Number(body.defaultUnitPrice ?? 0);
    if (!name || !description) {
      return NextResponse.json(
        { error: "Name and description are required" },
        { status: 400 },
      );
    }
    if (Number.isNaN(defaultUnitPrice) || defaultUnitPrice < 0) {
      return NextResponse.json(
        { error: "Invalid default unit price" },
        { status: 400 },
      );
    }
    const isActive =
      typeof body.isActive === "boolean" ? body.isActive : true;
    const doc = await ItemMaster.create({
      name,
      description,
      defaultUnitPrice,
      isActive,
    });
    return NextResponse.json(JSON.parse(JSON.stringify(doc.toObject())), {
      status: 201,
    });
  } catch (error) {
    console.error("Error creating item master:", error);
    return NextResponse.json(
      { error: "Failed to create item" },
      { status: 500 },
    );
  }
}
