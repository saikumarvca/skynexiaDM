import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";
import dbConnect from "@/lib/mongodb";
import TeamRole from "@/models/TeamRole";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function TeamRolesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1"));
  const limit = 50;
  await dbConnect();
  const [items, total] = await Promise.all([
    TeamRole.find({ isDeleted: { $ne: true } })
      .sort({ roleName: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    TeamRole.countDocuments({ isDeleted: { $ne: true } }),
  ]);
  const roles = items.map((r) => JSON.parse(JSON.stringify(r)));
  const totalPages = Math.ceil(total / limit);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Roles & Permissions
            </h1>
            <p className="text-muted-foreground">
              Manage roles and permission groups.
            </p>
          </div>
          <Link href="/team/roles/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Role
            </Button>
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Roles ({total ?? 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {roles.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                <p>No roles yet. Seed team data to get default roles.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles.map(
                      (r: {
                        _id: string;
                        roleName: string;
                        description?: string;
                        permissions?: string[];
                      }) => (
                        <TableRow key={r._id}>
                          <TableCell className="font-medium">
                            {r.roleName}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {r.description ?? "—"}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {(r.permissions || []).length} permissions
                            </span>
                          </TableCell>
                          <TableCell>
                            <Link href={`/team/roles/${r._id}/edit`}>
                              <Button variant="outline" size="sm">
                                Edit
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ),
                    )}
                  </TableBody>
                </Table>
                {totalPages > 1 && (
                  <div className="mt-4 flex gap-2">
                    {page > 1 && (
                      <Link href={`/team/roles?page=${page - 1}`}>
                        <Button variant="outline" size="sm">
                          Previous
                        </Button>
                      </Link>
                    )}
                    {page < totalPages && (
                      <Link href={`/team/roles?page=${page + 1}`}>
                        <Button variant="outline" size="sm">
                          Next
                        </Button>
                      </Link>
                    )}
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
