"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Archive, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ArchiveClientButtonProps {
  clientId: string
  clientName: string
  disabled?: boolean
  className?: string
  size?: "default" | "sm" | "lg" | "icon"
  variant?: "default" | "outline" | "ghost" | "secondary"
}

export function ArchiveClientButton({
  clientId,
  clientName,
  disabled,
  className,
  size = "icon",
  variant = "outline",
}: ArchiveClientButtonProps) {
  const router = useRouter()
  const [archiving, setArchiving] = useState(false)

  async function archive(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (
      !confirm(
        `Archive "${clientName}"? They will be removed from the default client list (data is kept).`
      )
    ) {
      return
    }
    setArchiving(true)
    try {
      const res = await fetch(`/api/clients/${clientId}`, { method: "DELETE" })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "Request failed")
      }
      router.refresh()
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : "Failed to archive client")
    } finally {
      setArchiving(false)
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn(
        size === "icon" && "h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive",
        className
      )}
      disabled={disabled || archiving}
      title="Archive client"
      aria-label={`Archive ${clientName}`}
      onClick={archive}
    >
      {archiving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Archive className="h-4 w-4" />}
    </Button>
  )
}
