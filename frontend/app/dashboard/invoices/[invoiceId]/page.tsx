import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Send, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { serverFetch } from "@/lib/server-fetch";
import { notFound } from "next/navigation";

async function getInvoice(id: string) {
  try {
    const res = await serverFetch(`/api/invoices/${id}`);
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

interface PageProps {
  params: Promise<{ invoiceId: string }>;
}

export default async function InvoiceDetailPage({ params }: PageProps) {
  const { invoiceId } = await params;
  const invoice = await getInvoice(invoiceId);
  if (!invoice) notFound();

  const clientName =
    invoice.clientId?.businessName ?? invoice.clientId?.name ?? "—";

  return (
    <DashboardLayout>
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/invoices">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {invoice.invoiceNumber}
            </h1>
            <p className="text-sm text-muted-foreground">{clientName}</p>
          </div>
          <div className="ml-auto flex gap-2">
            {invoice.status !== "PAID" && invoice.status !== "CANCELLED" && (
              <form action={`/api/invoices/${invoiceId}/send`} method="POST">
                <Button type="submit" variant="outline" size="sm">
                  <Send className="mr-2 h-3.5 w-3.5" /> Send
                </Button>
              </form>
            )}
            {["SENT", "OVERDUE"].includes(invoice.status) && (
              <form
                action={`/api/invoices/${invoiceId}/mark-paid`}
                method="POST"
              >
                <Button type="submit" size="sm">
                  <CheckCircle2 className="mr-2 h-3.5 w-3.5" /> Mark Paid
                </Button>
              </form>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invoice Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
            <div>
              <span className="text-muted-foreground">Status</span>
              <p className="font-medium mt-0.5">{invoice.status}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Currency</span>
              <p className="font-medium mt-0.5">{invoice.currency}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Issue Date</span>
              <p className="font-medium mt-0.5">
                {new Date(invoice.issueDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Due Date</span>
              <p className="font-medium mt-0.5">
                {new Date(invoice.dueDate).toLocaleDateString()}
              </p>
            </div>
            {invoice.paidAt && (
              <div>
                <span className="text-muted-foreground">Paid At</span>
                <p className="font-medium mt-0.5">
                  {new Date(invoice.paidAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Line Items</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Description</th>
                  <th className="pb-2 pr-4 font-medium text-center">Qty</th>
                  <th className="pb-2 pr-4 font-medium text-right">
                    Unit Price
                  </th>
                  <th className="pb-2 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.map(
                  (
                    item: {
                      description: string;
                      quantity: number;
                      unitPrice: number;
                      total: number;
                    },
                    i: number,
                  ) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2 pr-4">{item.description}</td>
                      <td className="py-2 pr-4 text-center">{item.quantity}</td>
                      <td className="py-2 pr-4 text-right">
                        {invoice.currency} {Number(item.unitPrice).toFixed(2)}
                      </td>
                      <td className="py-2 text-right">
                        {invoice.currency} {Number(item.total).toFixed(2)}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
              <tfoot>
                <tr className="border-t">
                  <td
                    colSpan={3}
                    className="pt-2 pr-4 text-right text-muted-foreground"
                  >
                    Subtotal
                  </td>
                  <td className="pt-2 text-right">
                    {invoice.currency} {Number(invoice.subtotal).toFixed(2)}
                  </td>
                </tr>
                {invoice.tax > 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="pt-1 pr-4 text-right text-muted-foreground"
                    >
                      Tax
                    </td>
                    <td className="pt-1 text-right">
                      {invoice.currency} {Number(invoice.tax).toFixed(2)}
                    </td>
                  </tr>
                )}
                <tr>
                  <td colSpan={3} className="pt-1 pr-4 text-right font-bold">
                    Total
                  </td>
                  <td className="pt-1 text-right font-bold">
                    {invoice.currency} {Number(invoice.total).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
            {invoice.notes && (
              <p className="mt-4 text-sm text-muted-foreground">
                {invoice.notes}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
