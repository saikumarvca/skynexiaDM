import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import {
  assertAdmin,
  requireUserFromCookieHeader,
  requireUserFromRequest,
} from "@/lib/auth";
import { ApiError, toErrorResponse } from "@/lib/api-errors";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUserFromRequest(request);
    assertAdmin(user);

    await dbConnect();
    const users = await User.find({})
      .select("_id name email role isActive")
      .sort({ name: 1 });
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return toErrorResponse(error, { fallbackMessage: "Failed to fetch users" });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUserFromCookieHeader(req.headers.get("cookie"));
    assertAdmin(user);

    const body = (await req.json()) as {
      name?: string;
      email?: string;
      role?: string;
      password?: string;
    };
    const name = (body.name ?? "").trim();
    const email = (body.email ?? "").trim().toLowerCase();
    const role = (body.role ?? "MANAGER").trim();
    const password = body.password ?? "";

    if (!name || !email || !password) {
      return toErrorResponse(
        new ApiError({
          status: 400,
          code: "BAD_REQUEST",
          message: "name, email, and password are required",
        }),
      );
    }

    await dbConnect();
    const exists = await User.findOne({ email }).select("_id");
    if (exists)
      return toErrorResponse(
        new ApiError({
          status: 409,
          code: "CONFLICT",
          message: "Email already exists",
        }),
      );

    const passwordHash = await bcrypt.hash(password, 12);
    const created = await User.create({
      name,
      email,
      role,
      passwordHash,
      isActive: true,
    });
    return NextResponse.json({
      _id: created._id.toString(),
      name: created.name,
      email: created.email,
      role: created.role,
      isActive: created.isActive,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return toErrorResponse(error, { fallbackMessage: "Failed to create user" });
  }
}
