import Link from "next/link";
import { Suspense } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { QueryToast } from "@/components/query-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus,
  FileText,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { serverFetch } from "@/lib/server-fetch";
import { InvoiceStatusFilter } from "./invoice-status-filter";

async function getInvoices(status?: string) {
  try {
    const url = status ? `/api/invoices?status=${status}` : "/api/invoices";
    const res = await serverFetch(url);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

interface Invoice {
  _id: string;
  invoiceNumber: string;
  status: string;
  issueDate: string;
  dueDate: string;
  total: number;
  currency: string;
  clientId?: { _id: string; businessName?: string; name?: string };
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-700",
    SENT: "bg-blue-100 text-blue-800",
    PAID: "bg-green-100 text-green-800",
    OVERDUE: "bg-red-100 text-red-800",
    CANCELLED: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${map[status] ?? "bg-muted text-muted-foreground"}`}
    >
      {status}
    </span>
  );
}

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function InvoicesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const invoices: Invoice[] = await getInvoices(params.status);

  const total = invoices.reduce((s, i) => s + i.total, 0);
  const unpaid = invoices
    .filter((i) => ["SENT", "OVERDUE"].includes(i.status))
    .reduce((s, i) => s + i.total, 0);
  const overdue = invoices.filter((i) => i.status === "OVERDUE").length;

  return (
    <DashboardLayout>
      <Suspense fallback={null}>
        <QueryToast message="Invoice created" />
      </Suspense>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
            <p className="text-muted-foreground">
              Create, send, and track client invoices.
            </p>
          </div>
          <Link href="/dashboard/invoices/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Invoice
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 py-5">
              <DollarSign className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">${total.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total invoiced</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 py-5">
              <Clock className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">${unpaid.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Outstanding</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 py-5">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{overdue}</p>
                <p className="text-sm text-muted-foreground">Overdue</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                Invoices ({invoices.length})
              </CardTitle>
              <InvoiceStatusFilter defaultStatus={params.status} />
            </div>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <FileText className="mx-auto mb-3 h-10 w-10 opacity-30" />
                <p>No invoices found.</p>
                <Link href="/dashboard/invoices/new">
                  <Button className="mt-4" variant="outline">
                    Create first invoice
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-4 font-medium">Invoice #</th>
                      <th className="pb-2 pr-4 font-medium">Client</th>
                      <th className="pb-2 pr-4 font-medium">Status</th>
                      <th className="pb-2 pr-4 font-medium">Issue Date</th>
                      <th className="pb-2 pr-4 font-medium">Due Date</th>
                      <th className="pb-2 font-medium text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr
                        key={inv._id}
                        className="border-b last:border-0 hover:bg-muted/40"
                      >
                        <td className="py-2.5 pr-4">
                          <Link
                            href={`/dashboard/invoices/${inv._id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {inv.invoiceNumber}
                          </Link>
                        </td>
                        <td className="py-2.5 pr-4 text-muted-foreground">
                          {inv.clientId?.businessName ??
                            inv.clientId?.name ??
                            "—"}
                        </td>
                        <td className="py-2.5 pr-4">
                          <StatusBadge status={inv.status} />
                        </td>
                        <td className="py-2.5 pr-4 text-muted-foreground">
                          {new Date(inv.issueDate).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 pr-4 text-muted-foreground">
                          {new Date(inv.dueDate).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 text-right font-medium">
                          {inv.currency} {inv.total.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
