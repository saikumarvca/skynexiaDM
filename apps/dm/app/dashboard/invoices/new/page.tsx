"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    clientId: "",
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: "",
    currency: "USD",
    notes: "",
    tax: 0,
  });
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: "Retainer fee", quantity: 1, unitPrice: 0 },
  ]);

  const subtotal = lineItems.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  const total = subtotal + Number(form.tax);

  function updateLineItem(
    i: number,
    field: keyof LineItem,
    value: string | number,
  ) {
    setLineItems((items) =>
      items.map((item, j) => (j === i ? { ...item, [field]: value } : item)),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const items = lineItems.map((l) => ({
        ...l,
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
        total: Number(l.quantity) * Number(l.unitPrice),
      }));
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          tax: Number(form.tax),
          lineItems: items,
          subtotal,
          total,
          status: "DRAFT",
          issueDate: new Date(form.issueDate),
          dueDate: new Date(form.dueDate),
        }),
      });
      if (!res.ok) {
        const j = await res.json();
        setError(j.error ?? "Failed to create invoice");
        return;
      }
      const inv = await res.json();
      router.push(`/dashboard/invoices/${inv._id}?created=1`);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

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
            <h1 className="text-2xl font-bold tracking-tight">New Invoice</h1>
            <p className="text-sm text-muted-foreground">
              Create a new client invoice.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Client ID *
                </label>
                <Input
                  required
                  value={form.clientId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, clientId: e.target.value }))
                  }
                  placeholder="MongoDB ObjectId"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Currency
                </label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  value={form.currency}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, currency: e.target.value }))
                  }
                >
                  {["USD", "EUR", "GBP", "AUD", "CAD"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Issue Date *
                </label>
                <Input
                  type="date"
                  required
                  value={form.issueDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, issueDate: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Due Date *
                </label>
                <Input
                  type="date"
                  required
                  value={form.dueDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, dueDate: e.target.value }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Line Items</CardTitle>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setLineItems((l) => [
                    ...l,
                    { description: "", quantity: 1, unitPrice: 0 },
                  ])
                }
              >
                <Plus className="mr-1 h-3 w-3" /> Add Line
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {lineItems.map((item, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[1fr_80px_100px_32px] gap-2 items-center"
                >
                  <Input
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) =>
                      updateLineItem(i, "description", e.target.value)
                    }
                  />
                  <Input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) =>
                      updateLineItem(
                        i,
                        "quantity",
                        parseFloat(e.target.value) || 1,
                      )
                    }
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Unit price"
                    value={item.unitPrice}
                    onChange={(e) =>
                      updateLineItem(
                        i,
                        "unitPrice",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                  />
                  {lineItems.length > 1 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setLineItems((l) => l.filter((_, j) => j !== i))
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
              <div className="flex flex-col items-end gap-1 border-t pt-3 text-sm">
                <div className="flex gap-6">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">
                    {form.currency} {subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-muted-foreground">Tax</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    className="h-8 w-28 text-right"
                    value={form.tax}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        tax: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div className="flex gap-6 text-base font-bold">
                  <span>Total</span>
                  <span>
                    {form.currency} {total.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
                placeholder="Payment terms, bank details, etc."
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
              />
            </CardContent>
          </Card>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Invoice"}
            </Button>
            <Link href="/dashboard/invoices">
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
