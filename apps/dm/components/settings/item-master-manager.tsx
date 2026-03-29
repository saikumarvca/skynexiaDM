"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  BarChart3,
  Pencil,
  Plus,
  Trash2,
  Package,
} from "lucide-react";
import type { ItemMaster } from "@/types";

interface AnalyticsPayload {
  item: ItemMaster;
  lineCount: number;
  totalQuantity: number;
  totalRevenue: number;
  invoiceCount: number;
  byStatus: { status: string; lineCount: number; revenue: number }[];
}

const emptyForm = {
  name: "",
  description: "",
  defaultUnitPrice: 0,
  isActive: true,
};

export function ItemMasterManager() {
  const [items, setItems] = useState<ItemMaster[]>([]);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ItemMaster | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsPayload | null>(null);
  const [analyticsError, setAnalyticsError] = useState("");

  async function load() {
    setError("");
    try {
      const q = includeInactive ? "?includeInactive=true" : "";
      const res = await fetch(`/api/item-master${q}`);
      if (!res.ok) {
        setError("Could not load item master");
        return;
      }
      const data = await res.json();
      setItems(data);
    } catch {
      setError("Could not load item master");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [includeInactive]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEdit(item: ItemMaster) {
    setEditing(item);
    setForm({
      name: item.name,
      description: item.description,
      defaultUnitPrice: item.defaultUnitPrice,
      isActive: item.isActive,
    });
    setFormOpen(true);
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editing ? `/api/item-master/${editing._id}` : "/api/item-master";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "Save failed");
        return;
      }
      setFormOpen(false);
      await load();
    } catch {
      setError("Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function openAnalytics(item: ItemMaster) {
    setAnalytics(null);
    setAnalyticsError("");
    setAnalyticsOpen(true);
    setAnalyticsLoading(true);
    try {
      const res = await fetch(`/api/item-master/${item._id}/analytics`);
      if (!res.ok) {
        setAnalyticsError("Could not load analytics");
        return;
      }
      const data = await res.json();
      setAnalytics(data);
    } catch {
      setAnalyticsError("Could not load analytics");
    } finally {
      setAnalyticsLoading(false);
    }
  }

  async function removeItem(item: ItemMaster) {
    if (
      !window.confirm(
        `Delete "${item.name}"? Invoices that reference it will keep line text; analytics by catalog link will no longer count this item.`,
      )
    )
      return;
    const res = await fetch(`/api/item-master/${item._id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      setError("Delete failed");
      return;
    }
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/dashboard/settings">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => {
                setLoading(true);
                setIncludeInactive(e.target.checked);
              }}
              className="rounded border-input"
            />
            Show inactive
          </label>
          <Button type="button" size="sm" onClick={openCreate}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add item
          </Button>
        </div>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Item master</h1>
        <p className="text-muted-foreground">
          Reusable invoice line items. Pick these on new invoices to track
          revenue and usage here.
        </p>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5" />
            Catalog
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No items yet. Add your first product or service line.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Name</th>
                    <th className="pb-2 pr-4 font-medium">Invoice line text</th>
                    <th className="pb-2 pr-4 font-medium text-right">
                      Default price
                    </th>
                    <th className="pb-2 pr-4 font-medium">Status</th>
                    <th className="pb-2 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => (
                    <tr
                      key={row._id}
                      className={`border-b last:border-0 hover:bg-muted/40 ${!row.isActive ? "opacity-60" : ""}`}
                    >
                      <td className="py-2.5 pr-4 font-medium">{row.name}</td>
                      <td className="max-w-[240px] truncate py-2.5 pr-4 text-muted-foreground">
                        {row.description}
                      </td>
                      <td className="py-2.5 pr-4 text-right tabular-nums">
                        {Number(row.defaultUnitPrice).toFixed(2)}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${row.isActive ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground"}`}
                        >
                          {row.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                            title="Analytics"
                            onClick={() => openAnalytics(row)}
                          >
                            <BarChart3 className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                            title="Edit"
                            onClick={() => openEdit(row)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-destructive hover:text-destructive"
                            title="Delete"
                            onClick={() => removeItem(row)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit item" : "Add item"}</DialogTitle>
            <DialogDescription>
              This text appears on invoice lines when selected. Default price
              can be changed per invoice.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitForm} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Name *</label>
              <Input
                required
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. Google Reviews package"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Invoice line text *
              </label>
              <Input
                required
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Full description on PDF"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Default unit price
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.defaultUnitPrice}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    defaultUnitPrice: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) =>
                  setForm((f) => ({ ...f, isActive: e.target.checked }))
                }
                className="rounded border-input"
              />
              Active (shown in invoice catalog)
            </label>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : editing ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={analyticsOpen} onOpenChange={setAnalyticsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Item analytics
            </DialogTitle>
            <DialogDescription>
              Based on invoice lines that were added from this catalog entry.
              Manual lines without a catalog link are not included.
            </DialogDescription>
          </DialogHeader>
          {analyticsLoading && (
            <p className="text-sm text-muted-foreground">Loading…</p>
          )}
          {analyticsError && (
            <p className="text-sm text-destructive">{analyticsError}</p>
          )}
          {analytics && !analyticsLoading && (
            <div className="space-y-4">
              <div>
                <p className="font-medium">{analytics.item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {analytics.item.description}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-md border p-3">
                  <p className="text-muted-foreground">Invoices</p>
                  <p className="text-xl font-semibold tabular-nums">
                    {analytics.invoiceCount}
                  </p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-muted-foreground">Line items</p>
                  <p className="text-xl font-semibold tabular-nums">
                    {analytics.lineCount}
                  </p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-muted-foreground">Qty sold</p>
                  <p className="text-xl font-semibold tabular-nums">
                    {analytics.totalQuantity}
                  </p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-muted-foreground">Line revenue</p>
                  <p className="text-xl font-semibold tabular-nums">
                    {analytics.totalRevenue.toFixed(2)}
                  </p>
                </div>
              </div>
              {analytics.byStatus.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium">By invoice status</p>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-1 font-medium">Status</th>
                        <th className="pb-1 text-right font-medium">Lines</th>
                        <th className="pb-1 text-right font-medium">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.byStatus.map((s) => (
                        <tr key={s.status} className="border-b border-muted/50">
                          <td className="py-1.5">{s.status}</td>
                          <td className="py-1.5 text-right tabular-nums">
                            {s.lineCount}
                          </td>
                          <td className="py-1.5 text-right tabular-nums">
                            {s.revenue.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {analytics.lineCount === 0 && (
                <p className="text-sm text-muted-foreground">
                  No billed lines yet. Create an invoice and choose this item
                  from the catalog.
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
