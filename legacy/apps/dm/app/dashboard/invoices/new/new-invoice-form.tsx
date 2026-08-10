"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import type { Client, ItemMaster } from "@/types";

interface LineItem {
  itemMasterId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

function clientLabel(c: Client) {
  return c.businessName?.trim() || c.name?.trim() || "Unnamed client";
}

interface NewInvoiceFormProps {
  clients: Client[];
  itemMasters: ItemMaster[];
  defaultClientId?: string;
}

export function NewInvoiceForm({
  clients,
  itemMasters,
  defaultClientId = "",
}: NewInvoiceFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    clientId: defaultClientId,
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: "",
    currency: "INR",
    notes: "",
    tax: 0,
  });
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: "", quantity: 1, unitPrice: 0 },
  ]);

  useEffect(() => {
    if (defaultClientId) {
      setForm((f) => ({ ...f, clientId: defaultClientId }));
    }
  }, [defaultClientId]);

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

  function applyCatalogPick(i: number, masterId: string) {
    setLineItems((items) =>
      items.map((item, j) => {
        if (j !== i) return item;
        if (!masterId) {
          return { ...item, itemMasterId: undefined };
        }
        const m = itemMasters.find((x) => x._id === masterId);
        if (!m) return { ...item, itemMasterId: undefined };
        return {
          ...item,
          itemMasterId: masterId,
          description: m.description,
          unitPrice: m.defaultUnitPrice,
        };
      }),
    );
  }

  function updateLineDescription(i: number, value: string) {
    setLineItems((items) =>
      items.map((item, j) =>
        j === i
          ? { ...item, description: value, itemMasterId: undefined }
          : item,
      ),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const items = lineItems.map((l) => {
        const quantity = Number(l.quantity);
        const unitPrice = Number(l.unitPrice);
        const row: Record<string, unknown> = {
          description: l.description,
          quantity,
          unitPrice,
          total: quantity * unitPrice,
        };
        if (l.itemMasterId) row.itemMasterId = l.itemMasterId;
        return row;
      });
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
                Client *
              </label>
              <select
                required
                disabled={clients.length === 0}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm disabled:opacity-60"
                value={form.clientId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, clientId: e.target.value }))
                }
              >
                <option value="">
                  {clients.length === 0
                    ? "No clients loaded — add a client first"
                    : "Select client"}
                </option>
                {clients.map((c) => (
                  <option key={c._id} value={c._id}>
                    {clientLabel(c)}
                  </option>
                ))}
              </select>
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
                {["INR", "USD", "EUR", "GBP", "AUD", "CAD"].map((c) => (
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
            <p className="text-xs text-muted-foreground">
              Optional: choose a{" "}
              <Link
                href="/dashboard/settings/item-master"
                className="underline underline-offset-2 hover:text-foreground"
              >
                catalog item
              </Link>{" "}
              to fill the line and track analytics.
            </p>
            {lineItems.map((item, i) => (
              <div
                key={i}
                className="flex flex-col gap-2 sm:grid sm:grid-cols-[minmax(0,7.5rem)_1fr_4rem_5.5rem_auto] sm:items-center sm:gap-2"
              >
                <select
                  aria-label="Catalog item"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-xs sm:text-sm"
                  value={item.itemMasterId ?? ""}
                  onChange={(e) => applyCatalogPick(i, e.target.value)}
                >
                  <option value="">Custom line</option>
                  {itemMasters.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <Input
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) =>
                    updateLineDescription(i, e.target.value)
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
                    className="justify-self-end sm:justify-self-center"
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
  );
}
