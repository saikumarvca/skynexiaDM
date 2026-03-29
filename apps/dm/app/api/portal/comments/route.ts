import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import PortalComment from "@/models/PortalComment";
import { verifyPortalToken } from "@/lib/portal-auth";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const entityId = searchParams.get("entityId");
    const entityType = searchParams.get("entityType");
    if (!token)
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    const clientId = verifyPortalToken(token);
    if (!clientId)
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const query: Record<string, unknown> = { clientId };
    if (entityId) query.entityId = entityId;
    if (entityType) query.entityType = entityType;
    const comments = await PortalComment.find(query).sort({ createdAt: 1 });
    return NextResponse.json(comments);
  } catch (error) {
    console.error("Error fetching portal comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { token, entityType, entityId, authorType, authorName, bodyText } =
      body;
    if (!token)
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    const clientId = verifyPortalToken(token);
    if (!clientId)
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const comment = new PortalComment({
      clientId,
      entityType,
      entityId,
      authorType: authorType ?? "CLIENT",
      authorName: authorName ?? "Client",
      body: bodyText,
    });
    await comment.save();
    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Error creating portal comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 },
    );
  }
}
