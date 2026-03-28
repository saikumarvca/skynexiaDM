import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import Client from "@/models/Client";

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function POST(request: NextRequest) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    await dbConnect();
    const body = (await request.json()) as {
      email?: string;
      businessName?: string;
      excludeId?: string;
    };

    const excludeFilter: Record<string, unknown> = {};
    if (body.excludeId && mongoose.Types.ObjectId.isValid(body.excludeId)) {
      excludeFilter._id = { $ne: new mongoose.Types.ObjectId(body.excludeId) };
    }

    const result: { email?: boolean; businessName?: boolean } = {};

    if (body.email && typeof body.email === "string" && body.email.trim()) {
      const found = await Client.findOne({
        email: { $regex: new RegExp(`^${escapeRegex(body.email.trim())}$`, "i") },
        ...excludeFilter,
      });
      result.email = !!found;
    }

    if (body.businessName && typeof body.businessName === "string" && body.businessName.trim()) {
      const found = await Client.findOne({
        businessName: { $regex: new RegExp(`^${escapeRegex(body.businessName.trim())}$`, "i") },
        ...excludeFilter,
      });
      result.businessName = !!found;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error checking duplicate:", error);
    return NextResponse.json({ error: "Failed to check duplicate" }, { status: 500 });
  }
}
