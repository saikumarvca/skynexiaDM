import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from "bcryptjs";
import { assertAdmin, requireUserFromCookieHeader, requireUserFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUserFromRequest(request);
    assertAdmin(user);

    await dbConnect();
    const users = await User.find({ isActive: true })
      .select('_id name email role')
      .sort({ name: 1 });
    return NextResponse.json(users);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHENTICATED")
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      if (error.message === "FORBIDDEN")
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUserFromCookieHeader(req.headers.get("cookie"));
    assertAdmin(user);

    const body = (await req.json()) as { name?: string; email?: string; role?: string; password?: string };
    const name = (body.name ?? "").trim();
    const email = (body.email ?? "").trim().toLowerCase();
    const role = (body.role ?? "MANAGER").trim();
    const password = body.password ?? "";

    if (!name || !email || !password) {
      return NextResponse.json({ error: "name, email, and password are required" }, { status: 400 });
    }

    await dbConnect();
    const exists = await User.findOne({ email }).select("_id");
    if (exists) return NextResponse.json({ error: "Email already exists" }, { status: 409 });

    const passwordHash = await bcrypt.hash(password, 12);
    const created = await User.create({ name, email, role, passwordHash, isActive: true });
    return NextResponse.json({ _id: created._id.toString(), name: created.name, email: created.email, role: created.role });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
