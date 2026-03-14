"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Edit, UserCheck, UserX, Users, BarChart3 } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

interface MemberActionsProps {
  memberId: string;
  status: string;
}

export function MemberActions({ memberId, status }: MemberActionsProps) {
  const router = useRouter();

  async function handleActivate() {
    const res = await fetch(`${BASE}/api/team/members/${memberId}/activate`, {
      method: "PATCH",
    });
    if (res.ok) router.refresh();
  }

  async function handleDeactivate() {
    const res = await fetch(`${BASE}/api/team/members/${memberId}/deactivate`, {
      method: "PATCH",
    });
    if (res.ok) router.refresh();
  }

  return (
    <div className="flex items-center gap-1">
      <Link href={`/team/members/${memberId}/edit`}>
        <Button variant="ghost" size="sm" className="h-8" title="Edit">
          <Edit className="h-4 w-4" />
        </Button>
      </Link>
      <Link href={`/team/workload`}>
        <Button variant="ghost" size="sm" className="h-8" title="View Workload">
          <BarChart3 className="h-4 w-4" />
        </Button>
      </Link>
      <Link href={`/team/members/${memberId}/assign-clients`}>
        <Button variant="ghost" size="sm" className="h-8" title="Assign Clients">
          <Users className="h-4 w-4" />
        </Button>
      </Link>
      {status === "Active" ? (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-amber-600"
          onClick={handleDeactivate}
          title="Deactivate"
        >
          <UserX className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-green-600"
          onClick={handleActivate}
          title="Activate"
        >
          <UserCheck className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
