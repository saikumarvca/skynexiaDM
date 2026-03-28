import { redirect } from "next/navigation"
import { requireUser } from "@/lib/auth"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export async function DashboardLayout({ children }: DashboardLayoutProps) {
  let user: Awaited<ReturnType<typeof requireUser>>
  try {
    user = await requireUser()
  } catch {
    redirect("/login")
  }

  const isAdmin = user.role === "ADMIN"
  const sessionUser = { name: user.name, email: user.email }

  return (
    <div className="flex min-h-dvh bg-background">
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[100] -translate-y-[200%] rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-transform focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Skip to main content
      </a>
      <Sidebar isAdmin={isAdmin} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header sessionUser={sessionUser} showAdminLinks={isAdmin} isAdmin={isAdmin} />
        <main
          id="main-content"
          className="flex-1 overflow-y-auto p-4 sm:p-6 scroll-mt-4 outline-none focus:outline-none"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
