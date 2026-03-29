"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { SavedFiltersBar } from "@/components/saved-filters/saved-filters-bar"

interface ContentPageClientProps {
  children: React.ReactNode
}

export function ContentPageClient({ children }: ContentPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentFilters: Record<string, string> = {}
  searchParams.forEach((value, key) => {
    currentFilters[key] = value
  })

  function applyFilters(filters: Record<string, string>) {
    const params = new URLSearchParams(filters)
    router.push(`/dashboard/content?${params.toString()}`)
  }

  return (
    <div className="space-y-4">
      <SavedFiltersBar
        entityType="content"
        currentFilters={currentFilters}
        onApply={applyFilters}
      />
      {children}
    </div>
  )
}
