"use client"

import { useState, useLayoutEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { BarChart3, PanelLeftClose, PanelLeft } from "lucide-react"
import { DashboardNavLinks } from "@/components/dashboard-nav-links"

const SIDEBAR_COLLAPSED_KEY = "dm-sidebar-collapsed"

function persistCollapsed(next: boolean) {
  try {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0")
    document.documentElement.toggleAttribute("data-sidebar-collapsed", next)
  } catch {
    /* ignore */
  }
}

export function Sidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const [collapsed, setCollapsed] = useState(false)

  useLayoutEffect(() => {
    try {
      const c = localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1"
      setCollapsed(c)
      document.documentElement.toggleAttribute("data-sidebar-collapsed", c)
    } catch {
      /* ignore */
    }
  }, [])

  const toggleCollapsed = useCallback(() => {
    setCollapsed((c) => {
      const next = !c
      persistCollapsed(next)
      return next
    })
  }, [])

  return (
    <div
      id="app-sidebar"
      className={cn(
        "hidden h-full shrink-0 flex-col border-r bg-card transition-[width] duration-200 ease-out md:flex",
        collapsed ? "w-[4.25rem]" : "w-64"
      )}
    >
      <div
        className={cn(
          "flex h-16 items-center border-b gap-2",
          collapsed ? "flex-col justify-center px-1 py-2 gap-1.5" : "px-4 gap-2.5"
        )}
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary">
          <BarChart3 className="h-4 w-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <h1 className="min-w-0 flex-1 truncate text-base font-semibold tracking-tight">
            DM Dashboard
          </h1>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "group relative h-8 w-8 shrink-0 overflow-hidden rounded-md border border-primary/20 bg-primary/[0.07] text-primary shadow-none transition-[transform,box-shadow,background-color,border-color,color] duration-200 ease-out",
            "hover:border-primary/40 hover:bg-primary/[0.14] hover:text-primary hover:shadow-sm hover:scale-[1.05] motion-reduce:hover:scale-100",
            "active:scale-[0.94] motion-reduce:active:scale-100",
            "dark:border-primary/30 dark:bg-primary/10 dark:hover:bg-primary/18",
            collapsed && "mt-0.5"
          )}
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(circle_at_30%_30%,hsl(var(--primary)/0.22),transparent_65%)]"
          />
          {collapsed ? (
            <PanelLeft className="relative h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-px motion-reduce:group-hover:translate-x-0" />
          ) : (
            <PanelLeftClose className="relative h-4 w-4 transition-transform duration-200 ease-out group-hover:-translate-x-px motion-reduce:group-hover:translate-x-0" />
          )}
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto py-4 scrollbar-thin">
        <DashboardNavLinks isAdmin={isAdmin} collapsed={collapsed} />
      </div>
    </div>
  )
}
