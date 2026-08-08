import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ActivityItem {
  _id: string;
  userName: string;
  action: string;
  module: string;
  targetName?: string;
  createdAt: string;
}

interface TeamActivityFeedProps {
  items: ActivityItem[];
  members: { _id: string; name: string }[];
  currentParams: Record<string, string | undefined>;
  totalPages: number;
  total: number;
}

export function TeamActivityFeed({
  items,
  members,
  currentParams,
  totalPages,
  total,
}: TeamActivityFeedProps) {
  const page = Math.max(1, parseInt(currentParams.page || "1"));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Log</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          method="get"
          className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-muted-foreground">
              User
            </label>
            <select
              name="userId"
              defaultValue={currentParams.userId ?? ""}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              <option value="">All</option>
              {members.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-muted-foreground">
              Module
            </label>
            <select
              name="module"
              defaultValue={currentParams.module ?? ""}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              <option value="">All</option>
              <option value="team">Team</option>
              <option value="reviews">Reviews</option>
              <option value="leads">Leads</option>
              <option value="tasks">Tasks</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-muted-foreground">
              From
            </label>
            <input
              name="dateFrom"
              type="date"
              defaultValue={currentParams.dateFrom}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-muted-foreground">
              To
            </label>
            <input
              name="dateTo"
              type="date"
              defaultValue={currentParams.dateTo}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" variant="secondary">
              Apply
            </Button>
          </div>
        </form>

        {items.length === 0 ? (
          <p className="text-muted-foreground">No activity yet.</p>
        ) : (
          <>
            <ul className="space-y-3">
              {items.map((a) => (
                <li
                  key={a._id}
                  className="flex flex-wrap items-baseline justify-between gap-2 rounded border-b py-2 last:border-0"
                >
                  <span className="text-sm">
                    <strong>{a.userName}</strong> {a.action}
                    {a.targetName && (
                      <span className="text-muted-foreground">
                        : {a.targetName}
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(a.createdAt).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  Page {page} of {totalPages} ({total} total)
                </span>
                <div className="flex gap-2">
                  {page > 1 && (
                    <Link
                      href={`/team/activity?${new URLSearchParams({
                        ...currentParams,
                        page: String(page - 1),
                      }).toString()}`}
                    >
                      <Button variant="outline" size="sm">
                        Previous
                      </Button>
                    </Link>
                  )}
                  {page < totalPages && (
                    <Link
                      href={`/team/activity?${new URLSearchParams({
                        ...currentParams,
                        page: String(page + 1),
                      }).toString()}`}
                    >
                      <Button variant="outline" size="sm">
                        Next
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
