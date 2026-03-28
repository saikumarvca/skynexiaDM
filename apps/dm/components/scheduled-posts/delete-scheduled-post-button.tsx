"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

export function DeleteScheduledPostButton({ postId }: { postId: string }) {
  const router = useRouter()

  async function onDelete() {
    if (!confirm("Delete this scheduled post?")) return
    const res = await fetch(`/api/scheduled-posts/${postId}`, { method: "DELETE" })
    if (!res.ok) {
      alert("Could not delete post")
      return
    }
    router.refresh()
  }

  return (
    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onDelete}>
      <Trash2 className="h-4 w-4" />
      <span className="sr-only">Delete</span>
    </Button>
  )
}
