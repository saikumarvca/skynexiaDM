import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MemberActions } from "@/components/team/MemberActions";
import { Plus } from "lucide-react";
import dbConnect from "@/lib/mongodb";
import TeamMember from "@/models/TeamMember";
import TeamRole from "@/models/TeamRole";
import User from "@/models/User";

export const dynamic = "force-dynamic";

async function getMembers(params: { search?: string; roleId?: string; status?: string; department?: string; page?: number; limit?: number }) {
  await dbConnect();
  const query: Record<string, unknown> = { isDeleted: { $ne: true } };
  if (params.roleId) query.roleId = params.roleId;
  if (params.status && params.status !== "ALL") query.status = params.status;
  if (params.department) query.department = params.department;
  if (params.search) {
    query.$or = [
      { name: { $regex: params.search, $options: "i" } },
      { email: { $regex: params.search, $options: "i" } },
      { department: { $regex: params.search, $options: "i" } },
    ];
  }
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const [items, total] = await Promise.all([
    TeamMember.find(query).sort({ name: 1 }).skip((page - 1) * limit).limit(limit).lean(),
    TeamMember.countDocuments(query),
  ]);
  type MemberRow = {
    _id: string;
    name: string;
    email: string;
    roleName?: string;
    department?: string;
    status: string;
    joinedAt?: string;
    assignedClientIds?: unknown[];
    hasLogin?: boolean;
  };
  const serialized = items.map((i) => JSON.parse(JSON.stringify(i))) as MemberRow[];
  const emails = [...new Set(serialized.map((m) => String(m.email).trim().toLowerCase()))];
  const usersWithPassword =
    emails.length > 0
      ? await User.find({
          email: { $in: emails },
          passwordHash: { $exists: true, $nin: [null, ""] },
        })
          .select("email")
          .lean()
      : [];
  const loginByEmail = new Set(usersWithPassword.map((u) => String(u.email).toLowerCase()));
  const itemsWithLogin = serialized.map((m) => ({
    ...m,
    hasLogin: loginByEmail.has(String(m.email).trim().toLowerCase()),
  }));
  return { items: itemsWithLogin, total, page, limit, totalPages: Math.ceil(total / limit) };
}

async function getRoles() {
  await dbConnect();
  const items = await TeamRole.find({ isDeleted: { $ne: true } }).sort({ roleName: 1 }).limit(100).lean();
  return { items: items.map((i) => JSON.parse(JSON.stringify(i))) };
}

interface PageProps {
  searchParams: Promise<{ search?: string; roleId?: string; status?: string; department?: string; page?: string }>;
}

export default async function TeamMembersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1"));
  const [membersData, rolesData] = await Promise.all([
    getMembers({ search: params.search, roleId: params.roleId, status: params.status, department: params.department, page, limit: 20 }),
    getRoles(),
  ]);
  const members = membersData.items;
  const roles = rolesData.items;
  const assignedCount = (m: { assignedClientIds?: unknown[] }) => Array.isArray(m?.assignedClientIds) ? m.assignedClientIds.length : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Team Members</h1>
            <p className="text-muted-foreground">Manage internal team users and their assignments.</p>
          </div>
          <Link href="/team/members/new"><Button><Plus className="mr-2 h-4 w-4" />Add Member</Button></Link>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Filters</CardTitle></CardHeader>
          <CardContent>
            <form method="get" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <label className="mb-1 block text-sm font-medium text-muted-foreground">Search</label>
                <input name="search" type="search" defaultValue={params.search} placeholder="Name, email, department" className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-muted-foreground">Role</label>
                <select name="roleId" defaultValue={params.roleId ?? ""} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                  <option value="">All roles</option>
                  {roles.map((r: { _id: string; roleName: string }) => <option key={r._id} value={r._id}>{r.roleName}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-muted-foreground">Status</label>
                <select name="status" defaultValue={params.status ?? "ALL"} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                  <option value="ALL">All</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-muted-foreground">Department</label>
                <input name="department" type="text" defaultValue={params.department} placeholder="Department" className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm" />
              </div>
              <div className="flex items-end"><Button type="submit" variant="secondary">Apply</Button></div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Members ({membersData.total ?? 0})</CardTitle></CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                <p>No members found.</p>
                <Link href="/team/members/new"><Button className="mt-4" variant="outline"><Plus className="mr-2 h-4 w-4" />Add your first member</Button></Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead>
                      <TableHead>Department</TableHead><TableHead>Login</TableHead><TableHead>Assigned Clients</TableHead>
                      <TableHead>Status</TableHead><TableHead>Joined</TableHead><TableHead className="w-[140px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((m) => (
                      <TableRow key={m._id}>
                        <TableCell className="font-medium">{m.name}</TableCell>
                        <TableCell>{m.email}</TableCell>
                        <TableCell>{m.roleName ?? "—"}</TableCell>
                        <TableCell>{m.department ?? "—"}</TableCell>
                        <TableCell>
                          {m.hasLogin ? (
                            <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">Enabled</span>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell>{assignedCount(m)}</TableCell>
                        <TableCell>
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${m.status === "Active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>{m.status}</span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : "—"}</TableCell>
                        <TableCell><MemberActions memberId={m._id} status={m.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {membersData.totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                    <span>Page {membersData.page} of {membersData.totalPages}</span>
                    <div className="flex gap-2">
                      {membersData.page > 1 && <Link href={`/team/members?${new URLSearchParams({ ...params, page: String(membersData.page - 1) })}`}><Button variant="outline" size="sm">Previous</Button></Link>}
                      {membersData.page < membersData.totalPages && <Link href={`/team/members?${new URLSearchParams({ ...params, page: String(membersData.page + 1) })}`}><Button variant="outline" size="sm">Next</Button></Link>}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
