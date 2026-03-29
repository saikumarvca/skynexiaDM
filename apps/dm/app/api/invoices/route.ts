import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import Invoice from "@/models/Invoice";

async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await Invoice.countDocuments();
  return `INV-${year}-${String(count + 1).padStart(4, "0")}`;
}

export async function GET(request: NextRequest) {
  const denied = await requireSessionApi(request);
  if (denied) return denied;
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const status = searchParams.get("status");
    const query: Record<string, unknown> = {};
    if (clientId) query.clientId = clientId;
    if (status) query.status = status;
    const invoices = await Invoice.find(query)
      .populate("clientId", "name businessName email contactName")
      .sort({ createdAt: -1 });
    return NextResponse.json(invoices);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
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
    const invoiceNumber = await generateInvoiceNumber();
    const invoice = new Invoice({ ...body, invoiceNumber });
    await invoice.save();
    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 },
    );
  }
}
