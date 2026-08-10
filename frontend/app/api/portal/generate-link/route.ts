import { NextRequest, NextResponse } from "next/server";
import { requireUserFromRequest, assertAdmin } from "@/lib/auth";
import { generatePortalToken } from "@/lib/portal-auth";
import dbConnect from "@/lib/mongodb";
import Client from "@/models/Client";

export async function POST(request: NextRequest) {
  let sessionUser;
  try {
    sessionUser = await requireUserFromRequest(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    assertAdmin(sessionUser);
  } catch {
    return NextResponse.json(
      { error: "Forbidden: admin only" },
      { status: 403 },
    );
  }

  try {
    await dbConnect();
    const body = await request.json();
    const { clientId } = body as { clientId?: string };

    if (!clientId) {
      return NextResponse.json(
        { error: "clientId is required" },
        { status: 400 },
      );
    }

    const client = await Client.findById(clientId).lean();
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const token = generatePortalToken(clientId);
    const url = `/portal/${token}`;

    return NextResponse.json({ url, token });
  } catch (error) {
    console.error("Error generating portal link:", error);
    return NextResponse.json(
      { error: "Failed to generate portal link" },
      { status: 500 },
    );
  }
}
