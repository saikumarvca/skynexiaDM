import { z } from "zod";

export const teamMemberCreateSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    email: z.string().trim().email("Valid email is required"),
    phone: z.string().trim().min(1).optional(),
    roleId: z.string().trim().min(1).optional(),
    department: z.string().trim().min(1).optional(),
    notes: z.string().trim().min(1).optional(),
  })
  .strict();

export const teamAssignmentCreateSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required"),
    description: z.string().trim().min(1).optional(),
    assignmentType: z.enum(["review", "lead", "task", "campaign", "client", "other"]).optional(),
    sourceModule: z.enum(["reviews", "leads", "tasks", "campaigns", "clients"]).optional(),
    referenceId: z.string().trim().min(1).optional(),
    assignedToUserId: z.string().trim().min(1, "Assignee is required"),
    assignedToUserName: z.string().trim().min(1, "Assignee name is required"),
    assignedByUserId: z.string().trim().min(1, "Assigner is required"),
    assignedByUserName: z.string().trim().min(1, "Assigner name is required"),
    status: z.enum(["Pending", "In Progress", "Completed", "Cancelled"]).optional(),
    priority: z.enum(["Low", "Medium", "High", "Urgent"]).optional(),
    dueDate: z.string().trim().min(1).optional(),
    notes: z.string().trim().min(1).optional(),
  })
  .strict();

export const taskCreateSchema = z
  .object({
    clientId: z.string().trim().min(1, "Client is required"),
    title: z.string().trim().min(1, "Title is required"),
    description: z.string().trim().min(1).optional(),
    assignedToUserId: z.string().trim().min(1).optional(),
    assignedToName: z.string().trim().min(1).optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
    status: z.enum(["TODO", "IN_PROGRESS", "BLOCKED", "DONE"]).optional(),
    deadline: z.string().trim().min(1).optional(),
  })
  .strict();

export const markSharedSchema = z
  .object({
    customerName: z.string().trim().min(1, "Customer name is required"),
    customerContact: z.string().trim().min(1).optional(),
    platform: z.string().trim().min(1).optional(),
    sentDate: z.string().trim().min(1, "Sent date is required"),
    performedBy: z.string().trim().min(1).optional(),
  })
  .strict();

export const markPostedSchema = z
  .object({
    postedByName: z.string().trim().min(1, "Posted by name is required"),
    platform: z.string().trim().min(1, "Platform is required"),
    reviewLink: z.string().trim().min(1, "Review link is required"),
    proofUrl: z.string().trim().min(1).optional(),
    postedDate: z.string().trim().min(1, "Posted date is required"),
    markedUsedBy: z.string().trim().min(1).optional(),
    remarks: z.string().trim().min(1).optional(),
    performedBy: z.string().trim().min(1).optional(),
  })
  .strict();

