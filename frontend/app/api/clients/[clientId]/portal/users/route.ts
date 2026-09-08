import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { requireClientPortalStaff } from "@/lib/client-portal/staff-access";

interface RouteParams {
  params: Promise<{ clientId: string }>;
}

/** GET /api/clients/[clientId]/portal/users — CLIENT logins linked to this client. */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { clientId } = await params;
  const access = await requireClientPortalStaff(request, clientId);
  if (access.denied) return access.denied;

  try {
    await dbConnect();
    const users = await User.find({
      role: "CLIENT",
      clientId: new mongoose.Types.ObjectId(access.clientId),
    })
      .select("_id name email isActive createdAt")
      .sort({ createdAt: 1 })
      .lean();
    return NextResponse.json(
      users.map((u) => ({
        id: String(u._id),
        name: u.name,
        email: u.email,
        isActive: u.isActive,
        createdAt: new Date(u.createdAt).toISOString(),
      })),
    );
  } catch (error) {
    console.error("Error listing client logins:", error);
    return NextResponse.json({ error: "Failed to load client logins" }, { status: 500 });
  }
}
