import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import PortalApproval from "@/models/PortalApproval";
import { verifyPortalToken } from "@/lib/portal-auth";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    if (!token)
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    const clientId = verifyPortalToken(token);
    if (!clientId)
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const status = searchParams.get("status");
    const query: Record<string, unknown> = { clientId };
    if (status) query.status = status;
    const approvals = await PortalApproval.find(query).sort({ createdAt: -1 });
    return NextResponse.json(approvals);
  } catch (error) {
    console.error("Error fetching portal approvals:", error);
    return NextResponse.json(
      { error: "Failed to fetch approvals" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const {
      token,
      entityType,
      entityId,
      status,
      clientComment,
      reviewedByName,
    } = body;
    if (!token)
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    const clientId = verifyPortalToken(token);
    if (!clientId)
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const existing = await PortalApproval.findOne({
      clientId,
      entityType,
      entityId,
    });
    if (existing) {
      existing.status = status;
      existing.clientComment = clientComment;
      existing.reviewedByName = reviewedByName;
      existing.reviewedAt = new Date();
      await existing.save();
      return NextResponse.json(existing);
    }

    const approval = new PortalApproval({
      clientId,
      entityType,
      entityId,
      status,
      clientComment,
      reviewedByName,
      reviewedAt: new Date(),
    });
    await approval.save();
    return NextResponse.json(approval, { status: 201 });
  } catch (error) {
    console.error("Error saving portal approval:", error);
    return NextResponse.json(
      { error: "Failed to save approval" },
      { status: 500 },
    );
  }
}
