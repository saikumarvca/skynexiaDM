import { DashboardLayout } from "@/components/dashboard-layout";
import { requireUser, assertAdmin } from "@/lib/auth";
import { AdminUsersClient } from "./users-client";

import { getBaseUrl } from "@/lib/server-fetch";
const BASE = getBaseUrl();

async function getUsers() {
  const res = await fetch(`${BASE}/api/users`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load users");
  return res.json() as Promise<Array<{ _id: string; name: string; email: string; role: string }>>;
}

export default async function AdminUsersPage() {
  const user = await requireUser();
  assertAdmin(user);

  const users = await getUsers();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Create and manage login accounts.</p>
        </div>
        <AdminUsersClient initialUsers={users} />
      </div>
    </DashboardLayout>
  );
}

