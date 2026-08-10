import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import Invoice from "@/models/Invoice";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> },
) {
  const denied = await requireSessionApi(request);
  if (denied) return denied;
  try {
    await dbConnect();
    const { invoiceId } = await params;
    const invoice = await Invoice.findByIdAndUpdate(
      invoiceId,
      { status: "PAID", paidAt: new Date() },
      { new: true },
    );
    if (!invoice)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Error marking invoice paid:", error);
    return NextResponse.json(
      { error: "Failed to mark invoice paid" },
      { status: 500 },
    );
  }
}
