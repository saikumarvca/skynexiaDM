import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import { requireUserFromRequest } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import ContactBookEntry from "@/models/ContactBookEntry";
import { contactBookPatchSchema } from "@/lib/api/schemas";
import { parseWithSchema, apiError } from "@/lib/api/validation";
import { normalizeContactTags } from "@/lib/contact-book-tags";
import mongoose from "mongoose";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function ownershipFilter(id: string, userId: string, role: string) {
  if (role === "ADMIN") return { _id: id };
  return { _id: id, ownerUserId: userId };
}

export async function PATCH(request: NextRequest, ctx: RouteParams) {
  const denied = await requireSessionApi(request);
  if (denied) return denied;

  const parsed = await parseWithSchema(request, contactBookPatchSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const user = await requireUserFromRequest(request);
    const { id } = await ctx.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiError(404, "Contact not found", "NOT_FOUND");
    }

    const body = parsed.data;
    const $set: Record<string, unknown> = {};
    const $unset: Record<string, ""> = {};
    if (body.displayName !== undefined) $set.displayName = body.displayName;
    if (body.phone !== undefined) {
      if (body.phone === null) $unset.phone = "";
      else $set.phone = body.phone;
    }
    if (body.email !== undefined) {
      if (body.email === null) $unset.email = "";
      else $set.email = body.email;
    }
    if (body.notes !== undefined) {
      if (body.notes === null) $unset.notes = "";
      else $set.notes = body.notes;
    }
    if (body.tags !== undefined) {
      $set.tags =
        body.tags === null ? [] : normalizeContactTags(body.tags);
    }

    const updatePayload: Record<string, unknown> = {};
    if (Object.keys($set).length > 0) updatePayload.$set = $set;
    if (Object.keys($unset).length > 0) updatePayload.$unset = $unset;
    if (Object.keys(updatePayload).length === 0) {
      return apiError(400, "No fields to update", "VALIDATION_ERROR");
    }

    await dbConnect();
    const updated = await ContactBookEntry.findOneAndUpdate(
      ownershipFilter(id, user.userId, user.role),
      updatePayload,
      { new: true },
    ).lean();

    if (!updated) {
      return apiError(404, "Contact not found", "NOT_FOUND");
    }

    return NextResponse.json({
      _id: String(updated._id),
      ownerUserId: updated.ownerUserId,
      displayName: updated.displayName,
      phone: updated.phone,
      email: updated.email,
      notes: updated.notes,
      tags: updated.tags ?? [],
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    });
  } catch (error) {
    console.error("PATCH /api/contact-book/[id]:", error);
    return apiError(500, "Failed to update contact");
  }
}

export async function DELETE(request: NextRequest, ctx: RouteParams) {
  const denied = await requireSessionApi(request);
  if (denied) return denied;

  try {
    const user = await requireUserFromRequest(request);
    const { id } = await ctx.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiError(404, "Contact not found", "NOT_FOUND");
    }

    await dbConnect();
    const res = await ContactBookEntry.deleteOne(
      ownershipFilter(id, user.userId, user.role),
    );
    if (res.deletedCount === 0) {
      return apiError(404, "Contact not found", "NOT_FOUND");
    }
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/contact-book/[id]:", error);
    return apiError(500, "Failed to delete contact");
  }
}
