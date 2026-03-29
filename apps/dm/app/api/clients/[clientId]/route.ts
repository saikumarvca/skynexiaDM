import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import Client from "@/models/Client";
import {
  clientUpsertSchema,
  mongoFieldsFromClientUpsert,
} from "@/lib/api/schemas";

const clientStatusPatchSchema = z
  .object({ status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]) })
  .strict();

interface RouteParams {
  params: Promise<{ clientId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    await dbConnect();

    const { clientId } = await params;
    const client = await Client.findOne({ _id: clientId });
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error("Error fetching client:", error);
    return NextResponse.json(
      { error: "Failed to fetch client" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    await dbConnect();

    const { clientId } = await params;
    const body = await request.json();
    const parsed = clientUpsertSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid client data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const fields = mongoFieldsFromClientUpsert(parsed.data);
    const client = await Client.findOneAndUpdate(
      { _id: clientId },
      { ...fields, updatedAt: new Date() },
      { new: true, runValidators: true },
    );

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error("Error updating client:", error);
    return NextResponse.json(
      { error: "Failed to update client" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    await dbConnect();

    const { clientId } = await params;
    const body = await request.json();
    const parsed = clientStatusPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const client = await Client.findOneAndUpdate(
      { _id: clientId },
      { status: parsed.data.status, updatedAt: new Date() },
      { new: true, runValidators: true },
    );

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error("Error patching client:", error);
    return NextResponse.json(
      { error: "Failed to update client" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    await dbConnect();

    const { clientId } = await params;
    const client = await Client.findOneAndUpdate(
      { _id: clientId },
      { status: "ARCHIVED", updatedAt: new Date() },
      { new: true },
    );

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Client archived successfully" });
  } catch (error) {
    console.error("Error archiving client:", error);
    return NextResponse.json(
      { error: "Failed to archive client" },
      { status: 500 },
    );
  }
}
