import TeamMember from '@/models/TeamMember';
import TeamAssignment from '@/models/TeamAssignment';
import ReviewAllocation from '@/models/ReviewAllocation';
import Task from '@/models/Task';
import {
  calculateOpenAssignments,
  getWorkloadStatus,
} from './workload';

export interface TeamOverviewStats {
  totalMembers: number;
  activeMembers: number;
  openAssignments: number;
  completedAssignments: number;
  pendingReviewsAssigned: number;
  averageWorkload: number;
  tasksCompletedThisWeek: number;
}

export async function getTeamOverviewStats(): Promise<TeamOverviewStats> {
  const [members, assignments, allocations, tasks] = await Promise.all([
    TeamMember.find({ isDeleted: { $ne: true } }).lean(),
    TeamAssignment.find({ isDeleted: { $ne: true } }).lean(),
    ReviewAllocation.countDocuments({
      allocationStatus: { $in: ['Assigned', 'Shared with Customer'] },
    }),
    Task.find({ status: 'DONE' }).lean(),
  ]);

  const openAssignments = assignments.filter(
    (a) => a.status === 'Pending' || a.status === 'In Progress'
  );
  const completedAssignments = assignments.filter(
    (a) => a.status === 'Completed'
  ).length;

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const tasksCompletedThisWeek = tasks.filter(
    (t) => t.updatedAt && new Date(t.updatedAt) >= oneWeekAgo
  ).length;

  const memberIds = new Set(members.map((m) => m._id.toString()));
  const assignmentsByMember: Record<string, typeof openAssignments> = {};
  for (const m of members) {
    const id = m._id.toString();
    assignmentsByMember[id] = openAssignments.filter(
      (a) => a.assignedToUserId === id
    );
  }
  const workloads = Object.values(assignmentsByMember).map((arr) => arr.length);
  const averageWorkload =
    workloads.length > 0
      ? Math.round(
          workloads.reduce((a, b) => a + b, 0) / workloads.length
        )
      : 0;

  return {
    totalMembers: members.length,
    activeMembers: members.filter((m) => m.status === 'Active').length,
    openAssignments: openAssignments.length,
    completedAssignments,
    pendingReviewsAssigned: allocations,
    averageWorkload,
    tasksCompletedThisWeek,
  };
}

export function computeMemberWorkloadStatus(
  openCount: number
): ReturnType<typeof getWorkloadStatus> {
  return getWorkloadStatus(openCount);
}
