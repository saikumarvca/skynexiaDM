import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Integration from "@/models/Integration";
import IntegrationEvent from "@/models/IntegrationEvent";
import Lead from "@/models/Lead";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();
    const { id } = await params;
    const authHeader =
      request.headers.get("x-api-key") ??
      request.headers.get("authorization")?.replace("Bearer ", "");
    const integration = await Integration.findById(id);
    if (!integration)
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 },
      );
    if (!integration.isActive)
      return NextResponse.json(
        { error: "Integration is inactive" },
        { status: 403 },
      );
    if (integration.apiKey !== authHeader)
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });

    const payload = await request.json();
    let status: "PROCESSED" | "FAILED" | "IGNORED" = "IGNORED";
    let resultEntityId = undefined;
    let errorMessage = undefined;

    try {
      const mappings = integration.fieldMappings ?? [];
      const leadData: Record<string, unknown> = {
        clientId: integration.clientId,
        source: integration.type,
      };

      for (const mapping of mappings) {
        const value = payload[mapping.sourceField];
        if (value !== undefined) leadData[mapping.targetField] = value;
      }

      if (leadData.clientId && (leadData.name || leadData.email)) {
        const lead = await Lead.create({
          clientId: leadData.clientId,
          name: leadData.name ?? "Unknown (via integration)",
          email: leadData.email,
          phone: leadData.phone,
          source: String(integration.type),
          status: "NEW",
          notes: `Auto-imported from ${integration.name}`,
        });
        resultEntityId = lead._id;
        status = "PROCESSED";
      }

      await Integration.findByIdAndUpdate(id, { lastReceivedAt: new Date() });
    } catch (err) {
      status = "FAILED";
      errorMessage = err instanceof Error ? err.message : String(err);
    }

    await IntegrationEvent.create({
      integrationId: id,
      receivedAt: new Date(),
      payload,
      status,
      resultEntityId,
      errorMessage,
    });

    return NextResponse.json({
      ok: status === "PROCESSED",
      status,
      resultEntityId,
    });
  } catch (error) {
    console.error("Error ingesting integration payload:", error);
    return NextResponse.json(
      { error: "Failed to process integration event" },
      { status: 500 },
    );
  }
}
