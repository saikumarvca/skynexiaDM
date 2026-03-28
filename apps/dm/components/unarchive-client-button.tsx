"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ArchiveRestore, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface UnarchiveClientButtonProps {
  clientId: string
  clientName: string
  disabled?: boolean
  className?: string
}

export function UnarchiveClientButton({
  clientId,
  clientName,
  disabled,
  className,
}: UnarchiveClientButtonProps) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function unarchive(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setBusy(true)
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVE" }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "Request failed")
      }
      toast.success(`Restored ${clientName} to active clients`)
      router.refresh()
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : "Failed to unarchive client")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn("shrink-0 gap-1.5", className)}
      disabled={disabled || busy}
      title="Unarchive client"
      aria-label={`Unarchive ${clientName}`}
      onClick={unarchive}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArchiveRestore className="h-4 w-4" />}
      Unarchive
    </Button>
  )
}
