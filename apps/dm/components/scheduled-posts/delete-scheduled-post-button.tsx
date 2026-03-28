"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Archive } from "lucide-react"

export function DeleteScheduledPostButton({ postId }: { postId: string }) {
  const router = useRouter()

  async function onCancel() {
    if (!confirm("Cancel this scheduled post?")) return
    const res = await fetch(`/api/scheduled-posts/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" }),
    })
    if (!res.ok) {
      alert("Could not cancel post")
      return
    }
    router.refresh()
  }

  return (
    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={onCancel}>
      <Archive className="h-4 w-4" />
      <span className="sr-only">Cancel post</span>
    </Button>
  )
}
