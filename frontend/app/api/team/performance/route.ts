import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import TeamMember from "@/models/TeamMember";
import TeamAssignment from "@/models/TeamAssignment";
import ReviewAllocation from "@/models/ReviewAllocation";
import {
  calculateOpenAssignments,
  calculateUrgentCount,
  calculateDueSoonCount,
  getWorkloadStatus,
} from "@/lib/team/workload";

export interface MemberPerformanceMetrics {
  memberId: string;
  memberName: string;
  department?: string;
  totalAssigned: number;
  completed: number;
  pending: number;
  overdue: number;
  completionRate: number;
  reviewAssignmentsCompleted: number;
  openAssignments: number;
  urgentCount: number;
  dueSoonCount: number;
  workloadStatus: string;
}

export async function GET(request: NextRequest) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("memberId");
    const department = searchParams.get("department");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const memberQuery: Record<string, unknown> = { isDeleted: { $ne: true } };
    if (memberId) memberQuery._id = memberId;
    if (department) memberQuery.department = department;

    const members = await TeamMember.find(memberQuery).lean();
    const memberIds = members.map((m) => m._id.toString());

    const assignmentQuery: Record<string, unknown> = {
      assignedToUserId: { $in: memberIds },
      isDeleted: { $ne: true },
    };
    if (dateFrom || dateTo) {
      assignmentQuery.createdAt = {};
      if (dateFrom)
        (assignmentQuery.createdAt as Record<string, Date>).$gte = new Date(
          dateFrom,
        );
      if (dateTo) {
        const d = new Date(dateTo);
        d.setHours(23, 59, 59, 999);
        (assignmentQuery.createdAt as Record<string, Date>).$lte = d;
      }
    }

    const assignments = await TeamAssignment.find(assignmentQuery).lean();

    const reviewQuery: Record<string, unknown> = {
      assignedToUserId: { $in: memberIds },
      allocationStatus: "Used",
    };
    if (dateFrom || dateTo) {
      reviewQuery.usedDate = {};
      if (dateFrom)
        (reviewQuery.usedDate as Record<string, Date>).$gte = new Date(
          dateFrom,
        );
      if (dateTo) {
        const d = new Date(dateTo);
        d.setHours(23, 59, 59, 999);
        (reviewQuery.usedDate as Record<string, Date>).$lte = d;
      }
    }
    const reviewCompletions = await ReviewAllocation.aggregate([
      { $match: reviewQuery },
      { $group: { _id: "$assignedToUserId", count: { $sum: 1 } } },
    ]);
    const reviewCountByMember: Record<string, number> = {};
    for (const r of reviewCompletions) {
      reviewCountByMember[r._id as string] = r.count;
    }

    const metrics: MemberPerformanceMetrics[] = members.map((m) => {
      const id = m._id.toString();
      const memberAssignments = assignments.filter(
        (a) => a.assignedToUserId === id,
      );
      const open = memberAssignments.filter(
        (a) => a.status === "Pending" || a.status === "In Progress",
      );
      const completed = memberAssignments.filter(
        (a) => a.status === "Completed",
      ).length;
      const pending = memberAssignments.filter(
        (a) => a.status === "Pending" || a.status === "In Progress",
      ).length;
      const now = new Date();
      const overdue = memberAssignments.filter((a) => {
        if (a.status === "Completed" || a.status === "Cancelled") return false;
        return a.dueDate && new Date(a.dueDate) < now;
      }).length;

      const total = memberAssignments.length;
      const completionRate =
        total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        memberId: id,
        memberName: m.name,
        department: m.department,
        totalAssigned: total,
        completed,
        pending,
        overdue,
        completionRate,
        reviewAssignmentsCompleted: reviewCountByMember[id] ?? 0,
        openAssignments: open.length,
        urgentCount: calculateUrgentCount(open),
        dueSoonCount: calculateDueSoonCount(open),
        workloadStatus: getWorkloadStatus(open.length),
      };
    });

    return NextResponse.json({ items: metrics });
  } catch (error) {
    console.error("Error fetching team performance:", error);
    return NextResponse.json(
      { error: "Failed to fetch team performance" },
      { status: 500 },
    );
  }
}
