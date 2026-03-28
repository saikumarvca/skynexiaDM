"use client"

import { useState } from "react"
import { toast } from "sonner"
import { ChevronLeft, ChevronRight, Mail, Phone } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Lead, LeadStatus, Client } from "@/types"

const STATUSES: LeadStatus[] = ["NEW", "CONTACTED", "QUALIFIED", "CLOSED_WON", "CLOSED_LOST"]

const STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  CLOSED_WON: "Closed Won",
  CLOSED_LOST: "Closed Lost",
}

const STATUS_COLORS: Record<LeadStatus, { header: string; badge: string; card: string }> = {
  NEW: {
    header: "bg-blue-50 border-blue-200",
    badge: "bg-blue-100 text-blue-800",
    card: "border-blue-100",
  },
  CONTACTED: {
    header: "bg-amber-50 border-amber-200",
    badge: "bg-amber-100 text-amber-800",
    card: "border-amber-100",
  },
  QUALIFIED: {
    header: "bg-green-50 border-green-200",
    badge: "bg-green-100 text-green-800",
    card: "border-green-100",
  },
  CLOSED_WON: {
    header: "bg-emerald-50 border-emerald-200",
    badge: "bg-emerald-100 text-emerald-800",
    card: "border-emerald-100",
  },
  CLOSED_LOST: {
    header: "bg-gray-50 border-gray-200",
    badge: "bg-gray-100 text-gray-700",
    card: "border-gray-100",
  },
}

function clientName(lead: Lead): string {
  const id = typeof lead.clientId === "object" ? lead.clientId : null
  if (id && "businessName" in id) {
    return (id as { businessName?: string }).businessName ?? (id as { name?: string }).name ?? "—"
  }
  return "—"
}

interface LeadKanbanProps {
  leads: Lead[]
  clients: Client[]
}

export function LeadKanban({ leads: initialLeads }: LeadKanbanProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [moving, setMoving] = useState<string | null>(null)

  async function moveLead(lead: Lead, direction: "prev" | "next") {
    const currentIdx = STATUSES.indexOf(lead.status)
    const newIdx = direction === "prev" ? currentIdx - 1 : currentIdx + 1
    if (newIdx < 0 || newIdx >= STATUSES.length) return

    const newStatus = STATUSES[newIdx] as LeadStatus
    setMoving(lead._id)

    // Optimistic update
    setLeads((prev) =>
      prev.map((l) => (l._id === lead._id ? { ...l, status: newStatus } : l))
    )

    try {
      const res = await fetch(`/api/leads/${lead._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
        credentials: "include",
      })
      if (!res.ok) {
        // Revert on failure
        setLeads((prev) =>
          prev.map((l) => (l._id === lead._id ? { ...l, status: lead.status } : l))
        )
        const err = await res.json().catch(() => ({}))
        toast.error(typeof err.error === "string" ? err.error : "Failed to move lead")
      }
    } catch {
      // Revert on error
      setLeads((prev) =>
        prev.map((l) => (l._id === lead._id ? { ...l, status: lead.status } : l))
      )
      toast.error("Failed to move lead")
    } finally {
      setMoving(null)
    }
  }

  const byStatus = (status: LeadStatus) => leads.filter((l) => l.status === status)

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {STATUSES.map((status) => {
        const colors = STATUS_COLORS[status]
        const columnLeads = byStatus(status)
        const statusIdx = STATUSES.indexOf(status)

        return (
          <div key={status} className="flex flex-col gap-2 min-w-0">
            {/* Column header */}
            <div
              className={`flex items-center justify-between rounded-lg border px-3 py-2 ${colors.header}`}
            >
              <span className="text-sm font-semibold">{STATUS_LABELS[status]}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors.badge}`}>
                {columnLeads.length}
              </span>
            </div>

            {/* Lead cards */}
            <div className="flex flex-col gap-2">
              {columnLeads.length === 0 && (
                <div className="rounded-lg border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
                  No leads
                </div>
              )}
              {columnLeads.map((lead) => (
                <Card
                  key={lead._id}
                  className={`border ${colors.card} shadow-sm transition-opacity ${
                    moving === lead._id ? "opacity-50" : ""
                  }`}
                >
                  <CardContent className="p-3">
                    <p className="mb-1 font-medium leading-snug text-sm">{lead.name}</p>
                    <p className="mb-2 text-xs text-muted-foreground">{clientName(lead)}</p>
                    {lead.source && (
                      <p className="mb-1.5 text-xs text-muted-foreground">
                        <span className="font-medium">Source:</span> {lead.source}
                      </p>
                    )}
                    <div className="mb-2 flex flex-col gap-0.5">
                      {lead.email && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                          <Mail className="h-3 w-3 shrink-0" />
                          <span className="truncate">{lead.email}</span>
                        </span>
                      )}
                      {lead.phone && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3 shrink-0" />
                          {lead.phone}
                        </span>
                      )}
                    </div>

                    {/* Move buttons */}
                    <div className="flex items-center justify-between gap-1 border-t pt-2">
                      <button
                        className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        disabled={statusIdx === 0 || moving === lead._id}
                        onClick={() => moveLead(lead, "prev")}
                        title={
                          statusIdx > 0
                            ? `Move to ${STATUS_LABELS[STATUSES[statusIdx - 1] as LeadStatus]}`
                            : undefined
                        }
                      >
                        <ChevronLeft className="h-3 w-3" />
                        {statusIdx > 0 ? STATUS_LABELS[STATUSES[statusIdx - 1] as LeadStatus] : ""}
                      </button>
                      <button
                        className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        disabled={statusIdx === STATUSES.length - 1 || moving === lead._id}
                        onClick={() => moveLead(lead, "next")}
                        title={
                          statusIdx < STATUSES.length - 1
                            ? `Move to ${STATUS_LABELS[STATUSES[statusIdx + 1] as LeadStatus]}`
                            : undefined
                        }
                      >
                        {statusIdx < STATUSES.length - 1
                          ? STATUS_LABELS[STATUSES[statusIdx + 1] as LeadStatus]
                          : ""}
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
