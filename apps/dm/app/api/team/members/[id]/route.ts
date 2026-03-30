import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import TeamMember from "@/models/TeamMember";
import TeamRole from "@/models/TeamRole";
import {
  deactivateLinkedLoginForTeamMember,
  syncLoginUserFromTeamMember,
} from "@/lib/team-member-user-sync";
import { assertAdmin, requireUserFromRequest } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    await dbConnect();
    const { id } = await params;
    const member = await TeamMember.findOne({
      _id: id,
      isDeleted: { $ne: true },
    })
      .populate("roleId", "roleName permissions")
      .lean();

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }
    return NextResponse.json(member);
  } catch (error) {
    console.error("Error fetching team member:", error);
    return NextResponse.json(
      { error: "Failed to fetch team member" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    const rawPassword = typeof body.password === "string" ? body.password : "";
    const password = rawPassword.trim().length > 0 ? rawPassword : undefined;
    if (password && password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    const member = await TeamMember.findOne({
      _id: id,
      isDeleted: { $ne: true },
    });
    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const allowed = [
      "name",
      "email",
      "phone",
      "roleId",
      "department",
      "notes",
      "assignedClientIds",
      "assignedClientNamesSnapshot",
    ];
    for (const key of allowed) {
      if (body[key] !== undefined) member.set(key, body[key]);
    }
    if (body.roleId) {
      const role = await TeamRole.findById(body.roleId);
      if (role) member.roleName = role.roleName;
    }
    await member.save();

    try {
      await syncLoginUserFromTeamMember(member, password ? { password } : {});
    } catch (syncErr: unknown) {
      const code =
        syncErr && typeof syncErr === "object" && "code" in syncErr
          ? (syncErr as { code: number | string }).code
          : null;
      if (code === 11000 || code === "11000") {
        return NextResponse.json(
          { error: "A login account already exists for this email" },
          { status: 409 },
        );
      }
      throw syncErr;
    }

    const populated = await TeamMember.findById(member._id)
      .populate("roleId", "roleName permissions")
      .lean();
    return NextResponse.json(populated);
  } catch (error) {
    console.error("Error updating team member:", error);
    return NextResponse.json(
      { error: "Failed to update team member" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const sessionUser = await requireUserFromRequest(request);
    assertAdmin(sessionUser);

    let confirm = "";
    try {
      const body = (await request.json()) as { confirm?: unknown };
      confirm =
        typeof body?.confirm === "string" ? body.confirm.trim() : "";
    } catch {
      /* empty or invalid JSON body */
    }
    if (confirm !== "delete") {
      return NextResponse.json(
        { error: 'Confirmation required: send JSON body { "confirm": "delete" }' },
        { status: 400 },
      );
    }

    await dbConnect();
    const { id } = await params;

    const member = await TeamMember.findOne({
      _id: id,
      isDeleted: { $ne: true },
    });
    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const memberEmail = member.email.trim().toLowerCase();
    if (memberEmail === sessionUser.email.trim().toLowerCase()) {
      return NextResponse.json(
        { error: "You cannot remove your own team member record" },
        { status: 400 },
      );
    }

    member.isDeleted = true;
    member.deletedAt = new Date();
    member.status = "Inactive";
    await member.save();

    await deactivateLinkedLoginForTeamMember(member);

    return NextResponse.json({ message: "Member archived" });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHENTICATED")
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      if (error.message === "FORBIDDEN")
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error archiving team member:", error);
    return NextResponse.json(
      { error: "Failed to archive team member" },
      { status: 500 },
    );
  }
}
