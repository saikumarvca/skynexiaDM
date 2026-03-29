import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import WallMessage from "@/models/WallMessage";
import { requireUserFromRequest } from "@/lib/auth";
import { isConnectWallChannelId } from "@/lib/connect-wall";

const PAGE_SIZE = 120;

export async function GET(request: NextRequest) {
  try {
    await requireUserFromRequest(request);
    const channelId = request.nextUrl.searchParams.get("channel") ?? "";
    if (!isConnectWallChannelId(channelId)) {
      return NextResponse.json({ error: "Invalid channel" }, { status: 400 });
    }

    await dbConnect();
    const raw = await WallMessage.find({ channelId })
      .sort({ createdAt: -1 })
      .limit(PAGE_SIZE)
      .lean();

    const messages = [...raw].reverse().map((m) => ({
      id: String(m._id),
      channelId: m.channelId,
      authorId: String(m.authorId),
      authorName: m.authorName,
      body: m.body,
      createdAt:
        m.createdAt instanceof Date
          ? m.createdAt.toISOString()
          : String(m.createdAt),
    }));

    return NextResponse.json({ messages });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("connect-wall GET:", error);
    return NextResponse.json(
      { error: "Failed to load messages" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUserFromRequest(request);
    const body = (await request.json()) as {
      channelId?: string;
      body?: string;
    };
    const channelId = (body.channelId ?? "").trim();
    const text = (body.body ?? "").trim();

    if (!isConnectWallChannelId(channelId)) {
      return NextResponse.json({ error: "Invalid channel" }, { status: 400 });
    }
    if (!text) {
      return NextResponse.json(
        { error: "Message cannot be empty" },
        { status: 400 },
      );
    }
    if (text.length > 8000) {
      return NextResponse.json({ error: "Message too long" }, { status: 400 });
    }

    await dbConnect();
    const doc = await WallMessage.create({
      channelId,
      authorId: user.userId,
      authorName: user.name,
      body: text,
    });

    return NextResponse.json({
      message: {
        id: String(doc._id),
        channelId: doc.channelId,
        authorId: user.userId,
        authorName: doc.authorName,
        body: doc.body,
        createdAt: doc.createdAt.toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("connect-wall POST:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 },
    );
  }
}
