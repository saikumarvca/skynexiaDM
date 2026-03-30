import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import Client from "@/models/Client";
import ClientView from "@/models/ClientView";
import {
  clientUpsertSchema,
  mongoFieldsFromClientUpsert,
} from "@/lib/api/schemas";
import { UNASSIGNED_CLIENT_EMAIL } from "@/lib/reviews/unassigned-client";

export async function GET(request: NextRequest) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50");
    const viewId = searchParams.get("viewId");
    const includeSystem = searchParams.get("includeSystem") === "true";

    let baseQuery: Record<string, unknown> = {};
    if (search) {
      baseQuery = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { businessName: { $regex: search, $options: "i" } },
          { brandName: { $regex: search, $options: "i" } },
          { contactName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      };
    }

    let filters: Record<string, unknown> = {};
    if (viewId) {
      const view = await ClientView.findById(viewId);
      if (view) {
        filters = view.filters as Record<string, unknown>;
      }
    }

    const query: Record<string, unknown> = { ...filters, ...baseQuery };
    if (!includeSystem) query.email = { $ne: UNASSIGNED_CLIENT_EMAIL };

    const clients = await Client.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);

    return NextResponse.json(clients);
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    await dbConnect();

    const body = await request.json();
    const parsed = clientUpsertSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid client data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const fields = mongoFieldsFromClientUpsert(parsed.data);

    // Duplicate detection before save
    if (typeof fields.email === "string" && fields.email) {
      const emailEsc = fields.email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const emailDup = await Client.findOne({
        email: { $regex: new RegExp(`^${emailEsc}$`, "i") },
      });
      if (emailDup) {
        return NextResponse.json(
          { error: "A client with this email already exists", field: "email" },
          { status: 409 },
        );
      }
    }
    if (typeof fields.businessName === "string" && fields.businessName) {
      const bizEsc = fields.businessName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const bizDup = await Client.findOne({
        businessName: { $regex: new RegExp(`^${bizEsc}$`, "i") },
      });
      if (bizDup) {
        return NextResponse.json(
          {
            error: "A client with this business name already exists",
            field: "businessName",
          },
          { status: 409 },
        );
      }
    }

    const client = new Client(fields);
    await client.save();

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error("Error creating client:", error);
    const code =
      error && typeof error === "object" && "code" in error
        ? (error as { code: unknown }).code
        : undefined;
    if (code === 11000) {
      return NextResponse.json(
        { error: "A client with this email already exists" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Failed to create client" },
      { status: 500 },
    );
  }
}
