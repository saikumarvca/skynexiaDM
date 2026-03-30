import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import TeamMember from "@/models/TeamMember";
import TeamRole from "@/models/TeamRole";
import TeamAssignment from "@/models/TeamAssignment";
import TeamActivityLog from "@/models/TeamActivityLog";
import { PERMISSION_LIST } from "@/lib/team/permissions";
const DEFAULT_ROLES = [
  {
    roleName: "Admin",
    description: "Full system access",
    permissions: [...PERMISSION_LIST],
  },
  {
    roleName: "Manager",
    description: "Manage team and assignments",
    permissions: [
      "view_tasks",
      "work_assigned_tasks",
      "view_reviews",
      "work_assigned_reviews",
      "manage_clients",
      "manage_campaigns",
      "manage_content",
      "manage_seo",
      "manage_leads",
      "manage_tasks",
      "manage_reviews",
      "manage_team",
      "view_analytics",
      "assign_reviews",
      "assign_tasks",
    ],
  },
  {
    roleName: "Marketing Executive",
    description: "Marketing and campaign execution",
    permissions: [
      "view_tasks",
      "work_assigned_tasks",
      "view_reviews",
      "work_assigned_reviews",
      "manage_clients",
      "manage_campaigns",
      "manage_content",
      "manage_seo",
      "manage_leads",
      "manage_tasks",
      "manage_reviews",
      "view_analytics",
      "assign_tasks",
    ],
  },
  {
    roleName: "Review Manager",
    description: "Review drafts and allocations",
    permissions: [
      "view_tasks",
      "work_assigned_tasks",
      "view_reviews",
      "work_assigned_reviews",
      "manage_clients",
      "manage_reviews",
      "manage_tasks",
      "view_analytics",
      "assign_reviews",
      "assign_tasks",
    ],
  },
  {
    roleName: "Review Worker",
    description: "Work only on reviews assigned to you",
    permissions: ["view_reviews", "work_assigned_reviews"],
  },
  {
    roleName: "Sales",
    description: "Sales and leads",
    permissions: [
      "view_tasks",
      "work_assigned_tasks",
      "manage_clients",
      "manage_leads",
      "manage_tasks",
      "view_analytics",
    ],
  },
  {
    roleName: "Support",
    description: "Customer support",
    permissions: [
      "view_tasks",
      "work_assigned_tasks",
      "manage_clients",
      "manage_leads",
      "manage_tasks",
      "view_analytics",
    ],
  },
];

const DEMO_MEMBERS = [
  {
    name: "Rahul",
    email: "rahul@example.com",
    roleName: "Review Manager",
    department: "Reviews",
  },
  {
    name: "Priya",
    email: "priya@example.com",
    roleName: "Marketing Executive",
    department: "Marketing",
  },
  {
    name: "Kiran",
    email: "kiran@example.com",
    roleName: "Marketing Executive",
    department: "SEO",
  },
  {
    name: "Suresh",
    email: "suresh@example.com",
    roleName: "Sales",
    department: "Sales",
  },
  {
    name: "Anjali",
    email: "anjali@example.com",
    roleName: "Support",
    department: "Support",
  },
  {
    name: "Vikram",
    email: "vikram@example.com",
    roleName: "Manager",
    department: "Operations",
  },
  {
    name: "Meera",
    email: "meera@example.com",
    roleName: "Marketing Executive",
    department: "Content",
  },
];

export async function POST(request: NextRequest) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    await dbConnect();

    const body = await request.json().catch(() => ({}));
    const force = body.force === true;

    const existingRoles = await TeamRole.countDocuments({
      isDeleted: { $ne: true },
    });
    if (existingRoles > 0 && !force) {
      return NextResponse.json(
        { error: "Team data already exists. Use force: true to reseed." },
        { status: 400 },
      );
    }

    const created: {
      roles: number;
      members: number;
      assignments: number;
      activity: number;
    } = {
      roles: 0,
      members: 0,
      assignments: 0,
      activity: 0,
    };

    const roleMap: Record<string, string> = {};
    for (const r of DEFAULT_ROLES) {
      let role = await TeamRole.findOne({
        roleName: r.roleName,
        isDeleted: { $ne: true },
      });
      if (!role) {
        role = new TeamRole(r);
        await role.save();
        created.roles++;
      }
      roleMap[r.roleName] = role._id.toString();
    }

    const memberIds: string[] = [];
    const memberMap: Record<string, { id: string; name: string }> = {};
    for (const m of DEMO_MEMBERS) {
      const existing = await TeamMember.findOne({
        email: m.email,
        isDeleted: { $ne: true },
      });
      if (existing) {
        memberIds.push(existing._id.toString());
        memberMap[m.email] = {
          id: existing._id.toString(),
          name: existing.name,
        };
        continue;
      }
      const roleId = roleMap[m.roleName];
      const member = new TeamMember({
        name: m.name,
        email: m.email,
        roleId: roleId || undefined,
        roleName: m.roleName,
        department: m.department,
        status: "Active",
      });
      await member.save();
      memberIds.push(member._id.toString());
      memberMap[m.email] = { id: member._id.toString(), name: member.name };
      created.members++;
    }

    if (memberIds.length === 0) {
      const all = await TeamMember.find({ isDeleted: { $ne: true } }).lean();
      all.forEach((m) => {
        memberIds.push(m._id.toString());
        memberMap[(m as { email: string }).email] = {
          id: m._id.toString(),
          name: m.name,
        };
      });
    }

    const types = ["review", "task", "lead", "campaign", "client"] as const;
    const statuses = ["Pending", "In Progress", "Completed"] as const;
    const priorities = ["Low", "Medium", "High", "Urgent"] as const;

    for (let i = 0; i < 15; i++) {
      const assignee = memberMap[DEMO_MEMBERS[i % DEMO_MEMBERS.length]!.email];
      const assigner =
        memberMap[DEMO_MEMBERS[(i + 1) % DEMO_MEMBERS.length]!.email];
      if (!assignee || !assigner) continue;

      const due = new Date();
      due.setDate(due.getDate() + (i % 7) - 2);

      const a = new TeamAssignment({
        title: `Demo assignment ${i + 1}`,
        description: "Sample assignment for demo",
        assignmentType: types[i % types.length],
        sourceModule:
          types[i % types.length] === "review" ? "reviews" : "tasks",
        assignedToUserId: assignee.id,
        assignedToUserName: assignee.name,
        assignedByUserId: assigner.id,
        assignedByUserName: assigner.name,
        status: statuses[i % statuses.length],
        priority: priorities[i % priorities.length],
        dueDate: due,
      });
      await a.save();
      created.assignments++;
    }

    for (let i = 0; i < 10; i++) {
      const user = memberMap[DEMO_MEMBERS[i % DEMO_MEMBERS.length]!.email];
      if (!user) continue;

      const actions = [
        {
          action: "created assignment",
          module: "team",
          entityType: "assignment",
          targetName: `Demo assignment ${i + 1}`,
        },
        {
          action: "updated role",
          module: "team",
          entityType: "role",
          targetName: "Review Manager",
        },
        {
          action: "assigned review draft",
          module: "reviews",
          entityType: "allocation",
          targetName: "Review allocation",
        },
        {
          action: "marked review as used",
          module: "reviews",
          entityType: "posted_review",
          targetName: "Posted review",
        },
        {
          action: "updated member status",
          module: "team",
          entityType: "member",
          targetName: user.name,
        },
      ];
      const act = actions[i % actions.length]!;
      const log = new TeamActivityLog({
        userId: user.id,
        userName: user.name,
        action: act.action,
        module: act.module,
        entityType: act.entityType,
        entityId: `demo-${i}`,
        targetName: act.targetName,
      });
      await log.save();
      created.activity++;
    }

    return NextResponse.json({
      message: "Team seed completed",
      created,
    });
  } catch (error) {
    console.error("Error seeding team:", error);
    return NextResponse.json(
      { error: "Failed to seed team data" },
      { status: 500 },
    );
  }
}
