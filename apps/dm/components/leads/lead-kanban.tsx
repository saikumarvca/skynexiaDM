"use client"

import { useState, useRef } from "react"
import { toast } from "sonner"
import { ChevronLeft, ChevronRight, Mail, Phone, GripVertical } from "lucide-react"
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

const STATUS_COLORS: Record<LeadStatus, { header: string; badge: string; card: string; dropzone: string }> = {
  NEW: {
    header: "bg-blue-50 border-blue-200",
    badge: "bg-blue-100 text-blue-800",
    card: "border-blue-100",
    dropzone: "bg-blue-50/60 border-blue-300",
  },
  CONTACTED: {
    header: "bg-amber-50 border-amber-200",
    badge: "bg-amber-100 text-amber-800",
    card: "border-amber-100",
    dropzone: "bg-amber-50/60 border-amber-300",
  },
  QUALIFIED: {
    header: "bg-green-50 border-green-200",
    badge: "bg-green-100 text-green-800",
    card: "border-green-100",
    dropzone: "bg-green-50/60 border-green-300",
  },
  CLOSED_WON: {
    header: "bg-emerald-50 border-emerald-200",
    badge: "bg-emerald-100 text-emerald-800",
    card: "border-emerald-100",
    dropzone: "bg-emerald-50/60 border-emerald-300",
  },
  CLOSED_LOST: {
    header: "bg-gray-50 border-gray-200",
    badge: "bg-gray-100 text-gray-700",
    card: "border-gray-100",
    dropzone: "bg-gray-50/60 border-gray-300",
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
  const [dragOverColumn, setDragOverColumn] = useState<LeadStatus | null>(null)
  const dragLeadId = useRef<string | null>(null)

  async function updateLeadStatus(leadId: string, oldStatus: LeadStatus, newStatus: LeadStatus) {
    if (oldStatus === newStatus) return

    // Optimistic update
    setLeads((prev) =>
      prev.map((l) => (l._id === leadId ? { ...l, status: newStatus } : l))
    )
    setMoving(leadId)

    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
        credentials: "include",
      })
      if (!res.ok) {
        setLeads((prev) =>
          prev.map((l) => (l._id === leadId ? { ...l, status: oldStatus } : l))
        )
        const err = await res.json().catch(() => ({}))
        toast.error(typeof err.error === "string" ? err.error : "Failed to move lead")
      }
    } catch {
      setLeads((prev) =>
        prev.map((l) => (l._id === leadId ? { ...l, status: oldStatus } : l))
      )
      toast.error("Failed to move lead")
    } finally {
      setMoving(null)
    }
  }

  async function moveLead(lead: Lead, direction: "prev" | "next") {
    const currentIdx = STATUSES.indexOf(lead.status)
    const newIdx = direction === "prev" ? currentIdx - 1 : currentIdx + 1
    if (newIdx < 0 || newIdx >= STATUSES.length) return
    await updateLeadStatus(lead._id, lead.status, STATUSES[newIdx] as LeadStatus)
  }

  // Drag handlers
  function onDragStart(e: React.DragEvent, lead: Lead) {
    dragLeadId.current = lead._id
    e.dataTransfer.effectAllowed = "move"
    // Store lead id in transfer data as fallback
    e.dataTransfer.setData("text/plain", lead._id)
  }

  function onDragEnd() {
    dragLeadId.current = null
    setDragOverColumn(null)
  }

  function onDragOver(e: React.DragEvent, status: LeadStatus) {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverColumn(status)
  }

  function onDragLeave(e: React.DragEvent, colEl: HTMLDivElement | null) {
    // Only clear if leaving the column entirely (not entering a child)
    if (colEl && colEl.contains(e.relatedTarget as Node)) return
    setDragOverColumn(null)
  }

  async function onDrop(e: React.DragEvent, targetStatus: LeadStatus) {
    e.preventDefault()
    setDragOverColumn(null)
    const leadId = dragLeadId.current
    if (!leadId) return
    const lead = leads.find((l) => l._id === leadId)
    if (!lead) return
    await updateLeadStatus(lead._id, lead.status, targetStatus)
  }

  const byStatus = (status: LeadStatus) => leads.filter((l) => l.status === status)

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {STATUSES.map((status) => {
        const colors = STATUS_COLORS[status]
        const columnLeads = byStatus(status)
        const statusIdx = STATUSES.indexOf(status)
        const isOver = dragOverColumn === status

        return (
          <div
            key={status}
            className="flex flex-col gap-2 min-w-0"
            onDragOver={(e) => onDragOver(e, status)}
            onDragLeave={(e) => onDragLeave(e, e.currentTarget)}
            onDrop={(e) => onDrop(e, status)}
          >
            {/* Column header */}
            <div
              className={`flex items-center justify-between rounded-lg border px-3 py-2 ${colors.header}`}
            >
              <span className="text-sm font-semibold">{STATUS_LABELS[status]}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors.badge}`}>
                {columnLeads.length}
              </span>
            </div>

            {/* Drop zone */}
            <div
              className={`flex flex-col gap-2 min-h-[80px] rounded-lg border-2 border-dashed p-1 transition-colors ${
                isOver
                  ? `${colors.dropzone} border-solid`
                  : "border-transparent"
              }`}
            >
              {columnLeads.length === 0 && !isOver && (
                <div className="rounded-lg px-3 py-6 text-center text-xs text-muted-foreground">
                  No leads
                </div>
              )}
              {isOver && columnLeads.length === 0 && (
                <div className="rounded-lg px-3 py-6 text-center text-xs font-medium text-muted-foreground">
                  Drop here
                </div>
              )}

              {columnLeads.map((lead) => (
                <Card
                  key={lead._id}
                  draggable
                  onDragStart={(e) => onDragStart(e, lead)}
                  onDragEnd={onDragEnd}
                  className={`border ${colors.card} shadow-sm transition-opacity cursor-grab active:cursor-grabbing select-none ${
                    moving === lead._id ? "opacity-40" : "opacity-100"
                  }`}
                >
                  <CardContent className="p-3">
                    {/* Drag handle row */}
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <p className="font-medium leading-snug text-sm">{lead.name}</p>
                      <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/40 mt-0.5" />
                    </div>
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
                        title={statusIdx > 0 ? `Move to ${STATUS_LABELS[STATUSES[statusIdx - 1] as LeadStatus]}` : undefined}
                      >
                        <ChevronLeft className="h-3 w-3" />
                        {statusIdx > 0 ? STATUS_LABELS[STATUSES[statusIdx - 1] as LeadStatus] : ""}
                      </button>
                      <button
                        className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        disabled={statusIdx === STATUSES.length - 1 || moving === lead._id}
                        onClick={() => moveLead(lead, "next")}
                        title={statusIdx < STATUSES.length - 1 ? `Move to ${STATUS_LABELS[STATUSES[statusIdx + 1] as LeadStatus]}` : undefined}
                      >
                        {statusIdx < STATUSES.length - 1 ? STATUS_LABELS[STATUSES[statusIdx + 1] as LeadStatus] : ""}
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
