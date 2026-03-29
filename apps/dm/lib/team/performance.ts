import dbConnect from "@/lib/mongodb";
import TeamMember from "@/models/TeamMember";
import TeamAssignment from "@/models/TeamAssignment";
import ReviewAllocation from "@/models/ReviewAllocation";
import {
  calculateUrgentCount,
  calculateDueSoonCount,
  getWorkloadStatus,
} from "./workload";

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

export async function getPerformanceMetrics(
  params: { memberId?: string; department?: string } = {},
): Promise<MemberPerformanceMetrics[]> {
  await dbConnect();
  const memberQuery: Record<string, unknown> = { isDeleted: { $ne: true } };
  if (params.memberId) memberQuery._id = params.memberId;
  if (params.department) memberQuery.department = params.department;

  const members = await TeamMember.find(memberQuery).lean();
  const memberIds = members.map((m) => m._id.toString());

  const [assignments, reviewCompletions] = await Promise.all([
    TeamAssignment.find({
      assignedToUserId: { $in: memberIds },
      isDeleted: { $ne: true },
    }).lean(),
    ReviewAllocation.aggregate([
      {
        $match: {
          assignedToUserId: { $in: memberIds },
          allocationStatus: "Used",
        },
      },
      { $group: { _id: "$assignedToUserId", count: { $sum: 1 } } },
    ]),
  ]);

  const reviewCountByMember: Record<string, number> = {};
  for (const r of reviewCompletions)
    reviewCountByMember[r._id as string] = r.count;

  const now = new Date();
  return members.map((m) => {
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
    const pending = open.length;
    const overdue = memberAssignments.filter((a) => {
      if (a.status === "Completed" || a.status === "Cancelled") return false;
      return a.dueDate && new Date(a.dueDate) < now;
    }).length;
    const total = memberAssignments.length;
    return {
      memberId: id,
      memberName: m.name,
      department: m.department,
      totalAssigned: total,
      completed,
      pending,
      overdue,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      reviewAssignmentsCompleted: reviewCountByMember[id] ?? 0,
      openAssignments: open.length,
      urgentCount: calculateUrgentCount(open),
      dueSoonCount: calculateDueSoonCount(open),
      workloadStatus: getWorkloadStatus(open.length),
    };
  });
}
