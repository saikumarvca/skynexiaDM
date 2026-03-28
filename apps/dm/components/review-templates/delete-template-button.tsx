"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Archive } from "lucide-react"

export function DeleteTemplateButton({ templateId }: { templateId: string }) {
  const router = useRouter()

  async function onArchive() {
    if (!confirm("Archive this template?")) return
    const res = await fetch(`/api/templates/${templateId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isArchived: true }),
    })
    if (!res.ok) {
      alert("Could not archive template")
      return
    }
    router.refresh()
  }

  return (
    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={onArchive}>
      <Archive className="h-4 w-4" />
      <span className="sr-only">Archive</span>
    </Button>
  )
}
