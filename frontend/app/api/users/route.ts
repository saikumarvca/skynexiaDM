import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Client from "@/models/Client";
import bcrypt from "bcryptjs";
import {
  assertAdmin,
  requireUserFromCookieHeader,
  requireUserFromRequest,
} from "@/lib/auth";
import { ApiError, toErrorResponse } from "@/lib/api-errors";

const ROLES = [
  "ADMIN",
  "MANAGER",
  "CONTENT_WRITER",
  "DESIGNER",
  "ANALYST",
  "CLIENT",
] as const;
type Role = (typeof ROLES)[number];

function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

/** "Name — Business" label for a populated client reference. */
function clientLabel(ref: unknown): string | undefined {
  if (!ref || typeof ref !== "object") return undefined;
  const c = ref as { name?: string; businessName?: string };
  const name = (c.name ?? "").trim();
  const business = (c.businessName ?? "").trim();
  if (!name && !business) return undefined;
  if (business && business.toLowerCase() !== name.toLowerCase()) {
    return name ? `${name} — ${business}` : business;
  }
  return name || business;
}

function clientIdOf(ref: unknown): string | undefined {
  if (!ref) return undefined;
  if (typeof ref === "object" && "_id" in (ref as object)) {
    return String((ref as { _id: unknown })._id);
  }
  return String(ref);
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireUserFromRequest(request);
    assertAdmin(user);

    await dbConnect();
    const users = await User.find({})
      .select("_id name email role isActive clientId")
      .populate("clientId", "name businessName")
      .sort({ name: 1 })
      .lean();
    return NextResponse.json(
      users.map((u) => ({
        _id: String(u._id),
        name: u.name,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        clientId: clientIdOf(u.clientId),
        clientName: clientLabel(u.clientId),
      })),
    );
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
      clientId?: string;
    };
    const name = (body.name ?? "").trim();
    const email = (body.email ?? "").trim().toLowerCase();
    const role = (body.role ?? "MANAGER").trim();
    const password = body.password ?? "";
    const clientIdRaw = (body.clientId ?? "").trim();

    if (!name || !email || !password) {
      return toErrorResponse(
        new ApiError({
          status: 400,
          code: "BAD_REQUEST",
          message: "name, email, and password are required",
        }),
      );
    }
    if (!isRole(role)) {
      return toErrorResponse(
        new ApiError({
          status: 400,
          code: "BAD_REQUEST",
          message: `role must be one of ${ROLES.join(", ")}`,
        }),
      );
    }

    await dbConnect();

    // CLIENT logins must be linked to exactly one existing client.
    let clientRef: { _id: mongoose.Types.ObjectId; name?: string; businessName?: string } | null =
      null;
    if (role === "CLIENT") {
      if (!clientIdRaw || !mongoose.isValidObjectId(clientIdRaw)) {
        return toErrorResponse(
          new ApiError({
            status: 400,
            code: "BAD_REQUEST",
            message: "A client must be selected for a CLIENT login",
          }),
        );
      }
      clientRef = await Client.findById(clientIdRaw)
        .select("_id name businessName")
        .lean();
      if (!clientRef) {
        return toErrorResponse(
          new ApiError({
            status: 404,
            code: "NOT_FOUND",
            message: "Selected client was not found",
          }),
        );
      }
    }

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
      clientId: clientRef ? clientRef._id : null,
      passwordHash,
      isActive: true,
    });
    return NextResponse.json({
      _id: created._id.toString(),
      name: created.name,
      email: created.email,
      role: created.role,
      isActive: created.isActive,
      clientId: clientRef ? String(clientRef._id) : undefined,
      clientName: clientLabel(clientRef),
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return toErrorResponse(error, { fallbackMessage: "Failed to create user" });
  }
}
