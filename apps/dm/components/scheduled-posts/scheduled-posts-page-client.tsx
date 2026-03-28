"use client"

import { useEffect, useState } from "react"
import { LayoutList, CalendarDays } from "lucide-react"
import { ScheduledPost, Client } from "@/types"
import { PostsCalendar } from "./posts-calendar"

const STORAGE_KEY = "dm-posts-view"
type View = "list" | "calendar"

interface ScheduledPostsPageClientProps {
  posts: ScheduledPost[]
  clients: Client[]
  listContent: React.ReactNode
}

export function ScheduledPostsPageClient({
  posts,
  clients,
  listContent,
}: ScheduledPostsPageClientProps) {
  const [view, setView] = useState<View>("list")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === "list" || saved === "calendar") {
      setView(saved)
    }
    setMounted(true)
  }, [])

  function switchView(v: View) {
    setView(v)
    localStorage.setItem(STORAGE_KEY, v)
  }

  return (
    <div className="space-y-4">
      {/* View toggle */}
      <div className="flex justify-end">
        <div className="inline-flex rounded-md border bg-background shadow-sm" role="group">
          <button
            onClick={() => switchView("list")}
            className={`inline-flex items-center gap-1.5 rounded-l-md px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 ${
              view === "list"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <LayoutList className="h-4 w-4" />
            List
          </button>
          <button
            onClick={() => switchView("calendar")}
            className={`inline-flex items-center gap-1.5 rounded-r-md px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 ${
              view === "calendar"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <CalendarDays className="h-4 w-4" />
            Calendar
          </button>
        </div>
      </div>

      {/* View content */}
      {!mounted || view === "list" ? (
        listContent
      ) : (
        <PostsCalendar posts={posts} clients={clients} />
      )}
    </div>
  )
}
