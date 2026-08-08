import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Wallet,
  FileText,
  Clock,
  AlertCircle,
  Plus,
} from "lucide-react";
import { serverFetch } from "@/lib/server-fetch";

async function getInvoices() {
  try {
    const res = await serverFetch("/api/invoices");
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

const AR_STATUSES = ["SENT", "OVERDUE"] as const;

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

function daysPastDue(dueDate: string) {
  const due = new Date(dueDate).setHours(0, 0, 0, 0);
  const today = new Date().setHours(0, 0, 0, 0);
  return Math.floor((today - due) / (1000 * 60 * 60 * 24));
}

export default async function AccountsReceivablePage() {
  const all: Invoice[] = await getInvoices();
  const receivable = all.filter((i) =>
    AR_STATUSES.includes(i.status as (typeof AR_STATUSES)[number]),
  );
  receivable.sort((a, b) => {
    const ad = new Date(a.dueDate).getTime();
    const bd = new Date(b.dueDate).getTime();
    return ad - bd;
  });

  const totalAr = receivable.reduce((s, i) => s + i.total, 0);
  const overdueCount = receivable.filter((i) => i.status === "OVERDUE").length;
  const dueSoon = receivable.filter((i) => {
    if (i.status === "OVERDUE") return false;
    const d = daysPastDue(i.dueDate);
    return d <= 0 && d >= -7;
  }).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Accounts receivable
            </h1>
            <p className="text-muted-foreground">
              Outstanding balances from sent and overdue invoices.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/invoices">
              <Button variant="outline">All invoices</Button>
            </Link>
            <Link href="/dashboard/invoices/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New invoice
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 py-5">
              <Wallet className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">
                  ${totalAr.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Total A/R</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 py-5">
              <Clock className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{dueSoon}</p>
                <p className="text-sm text-muted-foreground">
                  Due in 7 days (sent)
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 py-5">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{overdueCount}</p>
                <p className="text-sm text-muted-foreground">Overdue</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Open receivables ({receivable.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {receivable.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Wallet className="mx-auto mb-3 h-10 w-10 opacity-30" />
                <p>No outstanding receivables.</p>
                <p className="mt-1 text-sm">
                  Sent and overdue invoices appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-4 font-medium">Invoice #</th>
                      <th className="pb-2 pr-4 font-medium">Client</th>
                      <th className="pb-2 pr-4 font-medium">Status</th>
                      <th className="pb-2 pr-4 font-medium">Due date</th>
                      <th className="pb-2 pr-4 font-medium">Days</th>
                      <th className="pb-2 font-medium text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receivable.map((inv) => {
                      const dpd = daysPastDue(inv.dueDate);
                      const daysLabel =
                        inv.status === "OVERDUE"
                          ? `${dpd} overdue`
                          : dpd < 0
                            ? `Due in ${Math.abs(dpd)}`
                            : "Due today";
                      return (
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
                            {new Date(inv.dueDate).toLocaleDateString()}
                          </td>
                          <td
                            className={`py-2.5 pr-4 ${inv.status === "OVERDUE" ? "font-medium text-red-600" : "text-muted-foreground"}`}
                          >
                            {daysLabel}
                          </td>
                          <td className="py-2.5 text-right font-medium">
                            {inv.currency} {inv.total.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
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
