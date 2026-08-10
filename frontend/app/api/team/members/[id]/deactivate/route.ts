import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import TeamMember from "@/models/TeamMember";
import { syncLoginUserFromTeamMember } from "@/lib/team-member-user-sync";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    await dbConnect();
    const { id } = await params;

    const member = await TeamMember.findOne({ _id: id });
    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    member.status = "Inactive";
    await member.save();
    await syncLoginUserFromTeamMember(member, {});

    return NextResponse.json(member);
  } catch (error) {
    console.error("Error deactivating team member:", error);
    return NextResponse.json(
      { error: "Failed to deactivate team member" },
      { status: 500 },
    );
  }
}
