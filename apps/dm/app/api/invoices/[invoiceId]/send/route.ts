import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import Invoice from "@/models/Invoice";
import { sendEmail } from "@/lib/email";

function esc(v: unknown): string {
  if (v == null) return "";
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildInvoiceHtml(invoice: {
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  lineItems: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  notes?: string;
  clientId: { businessName?: string; name?: string; email?: string } | string;
}): string {
  const clientName =
    typeof invoice.clientId === "object"
      ? ((invoice.clientId as { businessName?: string; name?: string })
          .businessName ??
        (invoice.clientId as { name?: string }).name ??
        "")
      : "";
  const rows = invoice.lineItems
    .map(
      (item) =>
        `<tr><td>${esc(item.description)}</td><td style="text-align:center">${esc(item.quantity)}</td><td style="text-align:right">${invoice.currency} ${Number(item.unitPrice).toFixed(2)}</td><td style="text-align:right">${invoice.currency} ${Number(item.total).toFixed(2)}</td></tr>`,
    )
    .join("");

  return `<!DOCTYPE html><html><head><style>body{font-family:Arial,sans-serif;font-size:13px;color:#111;margin:24px}h1{font-size:22px}table{width:100%;border-collapse:collapse;margin-top:16px}th{background:#f3f4f6;padding:8px;text-align:left}td{padding:6px 8px;border-bottom:1px solid #e5e7eb}.totals{margin-top:16px;text-align:right}.label{color:#666;margin-right:16px}</style></head><body>
  <h1>Invoice ${esc(invoice.invoiceNumber)}</h1>
  <p><strong>Client:</strong> ${esc(clientName)}</p>
  <p><strong>Issue Date:</strong> ${new Date(invoice.issueDate).toLocaleDateString()} &nbsp; <strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
  <table><thead><tr><th>Description</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table>
  <div class="totals">
    <p><span class="label">Subtotal:</span>${invoice.currency} ${Number(invoice.subtotal).toFixed(2)}</p>
    <p><span class="label">Tax:</span>${invoice.currency} ${Number(invoice.tax ?? 0).toFixed(2)}</p>
    <p><strong><span class="label">Total:</span>${invoice.currency} ${Number(invoice.total).toFixed(2)}</strong></p>
  </div>
  ${invoice.notes ? `<p style="margin-top:24px;color:#666">${esc(invoice.notes)}</p>` : ""}
</body></html>`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> },
) {
  const denied = await requireSessionApi(request);
  if (denied) return denied;
  try {
    await dbConnect();
    const { invoiceId } = await params;
    const invoice = await Invoice.findById(invoiceId).populate(
      "clientId",
      "name businessName email",
    );
    if (!invoice)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const clientEmail =
      typeof invoice.clientId === "object"
        ? (invoice.clientId as { email?: string }).email
        : null;
    if (!clientEmail) {
      return NextResponse.json(
        { error: "Client has no email address on file" },
        { status: 400 },
      );
    }

    const html = buildInvoiceHtml(invoice.toObject());
    const result = await sendEmail({
      to: clientEmail,
      subject: `Invoice ${invoice.invoiceNumber}`,
      html,
    });

    if (result.success) {
      await Invoice.findByIdAndUpdate(invoiceId, {
        status: "SENT",
        sentAt: new Date(),
      });
    }

    return NextResponse.json({ ok: result.success, error: result.error });
  } catch (error) {
    console.error("Error sending invoice:", error);
    return NextResponse.json(
      { error: "Failed to send invoice" },
      { status: 500 },
    );
  }
}
