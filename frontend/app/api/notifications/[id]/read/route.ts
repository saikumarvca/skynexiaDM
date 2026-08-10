import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import { requireUserFromRequest } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Notification from "@/models/Notification";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    const user = await requireUserFromRequest(request);
    await dbConnect();

    const { id } = await params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: user.userId },
      { isRead: true },
      { new: true },
    ).lean();

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(notification);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json(
      { error: "Failed to mark notification as read" },
      { status: 500 },
    );
  }
}
