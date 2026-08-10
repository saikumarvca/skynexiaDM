import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import Integration from "@/models/Integration";
import type { IntegrationType } from "@/models/Integration";
import crypto from "crypto";

const INTEGRATION_TYPES: IntegrationType[] = [
  "FACEBOOK_LEADS",
  "GOOGLE_ADS",
  "TYPEFORM",
  "GENERIC_WEBHOOK",
];

export async function GET(request: NextRequest) {
  const denied = await requireSessionApi(request);
  if (denied) return denied;
  try {
    await dbConnect();
    const integrations = await Integration.find({}).sort({ createdAt: -1 });
    return NextResponse.json(integrations);
  } catch (error) {
    console.error("Error fetching integrations:", error);
    return NextResponse.json(
      { error: "Failed to fetch integrations" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const denied = await requireSessionApi(request);
  if (denied) return denied;
  try {
    await dbConnect();
    const body = await request.json();

    const name =
      typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 },
      );
    }

    if (!INTEGRATION_TYPES.includes(body.type)) {
      return NextResponse.json(
        { error: "Invalid integration type" },
        { status: 400 },
      );
    }
    const type = body.type as IntegrationType;

    let clientId: mongoose.Types.ObjectId | undefined;
    const rawClient = body.clientId;
    if (
      rawClient !== undefined &&
      rawClient !== null &&
      String(rawClient).trim() !== ""
    ) {
      const idStr = String(rawClient).trim();
      if (!mongoose.Types.ObjectId.isValid(idStr)) {
        return NextResponse.json(
          { error: "Invalid client ID" },
          { status: 400 },
        );
      }
      clientId = new mongoose.Types.ObjectId(idStr);
    }

    const rawMappings = Array.isArray(body.fieldMappings)
      ? body.fieldMappings
      : [];
    const fieldMappings = rawMappings
      .map((m: Record<string, unknown>) => {
        const sourceField =
          typeof m?.sourceField === "string" ? m.sourceField.trim() : "";
        const targetField =
          typeof m?.targetField === "string" ? m.targetField.trim() : "";
        const targetModelRaw =
          typeof m?.targetModel === "string" ? m.targetModel.trim() : "";
        const targetModel =
          targetModelRaw === "Campaign" ? "Campaign" : "Lead";
        return { sourceField, targetField, targetModel };
      })
      .filter(
        (m: { sourceField: string; targetField: string; targetModel: string }) =>
          m.sourceField && m.targetField,
      );

    if (fieldMappings.length === 0) {
      return NextResponse.json(
        { error: "At least one complete field mapping is required" },
        { status: 400 },
      );
    }

    const config =
      typeof body.config === "object" &&
      body.config !== null &&
      !Array.isArray(body.config)
        ? (body.config as Record<string, unknown>)
        : {};

    const apiKey = crypto.randomBytes(24).toString("hex");
    const integration = new Integration({
      name,
      type,
      clientId,
      apiKey,
      config,
      fieldMappings,
    });
    await integration.save();
    return NextResponse.json(integration, { status: 201 });
  } catch (error) {
    console.error("Error creating integration:", error);
    return NextResponse.json(
      { error: "Failed to create integration" },
      { status: 500 },
    );
  }
}
