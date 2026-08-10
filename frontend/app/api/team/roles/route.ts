import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import TeamRole from "@/models/TeamRole";

export async function GET(request: NextRequest) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "20")),
    );
    const sortBy = searchParams.get("sortBy") || "roleName";
    const sortOrder = searchParams.get("sortOrder") === "desc" ? -1 : 1;

    const query: Record<string, unknown> = { isDeleted: { $ne: true } };
    const sortField =
      sortBy === "createdAt"
        ? "createdAt"
        : sortBy === "name"
          ? "roleName"
          : sortBy;

    const [items, total] = await Promise.all([
      TeamRole.find(query)
        .sort({ [sortField]: sortOrder })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      TeamRole.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);
    return NextResponse.json({
      items,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching team roles:", error);
    return NextResponse.json(
      { error: "Failed to fetch team roles" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    await dbConnect();

    const body = await request.json();
    const { roleName, description, permissions } = body;

    if (!roleName) {
      return NextResponse.json(
        { error: "Role name is required" },
        { status: 400 },
      );
    }

    const role = new TeamRole({
      roleName,
      description: description || undefined,
      permissions: Array.isArray(permissions) ? permissions : [],
    });
    await role.save();

    return NextResponse.json(role, { status: 201 });
  } catch (error) {
    console.error("Error creating team role:", error);
    return NextResponse.json(
      { error: "Failed to create team role" },
      { status: 500 },
    );
  }
}
