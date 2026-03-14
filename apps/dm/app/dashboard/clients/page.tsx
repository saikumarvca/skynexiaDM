import { DashboardLayout } from "@/components/dashboard-layout"

export default function DashboardClientsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
        <p className="text-muted-foreground">
          Manage your client accounts and view their performance.
        </p>
      </div>
    </DashboardLayout>
  )
}
