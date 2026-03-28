import { z } from "zod";

const emptyToUndef = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

const isoDateOrNull = z.union([
  z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Use yyyy-mm-dd"),
  z.null(),
]);

export const clientUpsertSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    businessName: z.string().trim().min(1, "Business name is required"),
    brandName: z.string().trim().min(1, "Brand name is required"),
    contactName: z.string().trim().min(1, "Contact name is required"),
    phone: z.string().trim().min(1, "Phone is required"),
    email: z.string().trim().email("Valid email is required"),
    notes: z.preprocess(emptyToUndef, z.string().trim().min(1).optional()),
    status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]),
    website: z.preprocess(emptyToUndef, z.string().trim().max(2048).optional()),
    industry: z.preprocess(emptyToUndef, z.string().trim().min(1).optional()),
    location: z.preprocess(emptyToUndef, z.string().trim().min(1).optional()),
    marketingChannels: z.array(z.string().trim().min(1)).optional(),
    contractStart: z.preprocess(
      (v) => (v === null ? null : v === "" || v === undefined ? undefined : v),
      isoDateOrNull.optional()
    ),
    contractEnd: z.preprocess(
      (v) => (v === null ? null : v === "" || v === undefined ? undefined : v),
      isoDateOrNull.optional()
    ),
    monthlyBudget: z.preprocess(
      (v) => (v === "" || v === undefined ? null : v),
      z.union([z.coerce.number().nonnegative(), z.null()]).optional()
    ),
    assignedManagerId: z.preprocess(
      (v) => (v === "" || v === undefined ? null : v),
      z.union([z.string().trim().min(1), z.null()]).optional()
    ),
  })
  .strict();

export type ClientUpsertInput = z.infer<typeof clientUpsertSchema>;

/** Map validated client body to Mongoose-compatible fields for create/update. */
export function mongoFieldsFromClientUpsert(parsed: ClientUpsertInput): Record<string, unknown> {
  const dateOrNull = (v: string | null | undefined) => {
    if (v === undefined) return undefined;
    if (v === null) return null;
    return new Date(`${v}T12:00:00.000Z`);
  };
  return {
    name: parsed.name,
    businessName: parsed.businessName,
    brandName: parsed.brandName,
    contactName: parsed.contactName,
    phone: parsed.phone,
    email: parsed.email,
    notes: parsed.notes,
    status: parsed.status,
    website: parsed.website,
    industry: parsed.industry,
    location: parsed.location,
    marketingChannels: parsed.marketingChannels ?? [],
    contractStart: dateOrNull(parsed.contractStart as string | null | undefined),
    contractEnd: dateOrNull(parsed.contractEnd as string | null | undefined),
    monthlyBudget:
      parsed.monthlyBudget === undefined
        ? undefined
        : parsed.monthlyBudget === null
          ? null
          : parsed.monthlyBudget,
    assignedManagerId:
      parsed.assignedManagerId === undefined
        ? undefined
        : parsed.assignedManagerId === null
          ? null
          : parsed.assignedManagerId,
  };
}

export const scheduledPostStatusSchema = z.enum([
  "SCHEDULED",
  "PUBLISHED",
  "FAILED",
  "CANCELLED",
]);

export const scheduledPostCreateSchema = z
  .object({
    clientId: z.string().trim().min(1, "Client is required"),
    content: z.string().trim().min(1, "Content is required"),
    platform: z.string().trim().min(1, "Platform is required"),
    publishDate: z.string().trim().min(1, "Publish date is required"),
    timeZone: z.preprocess(emptyToUndef, z.string().trim().min(1).optional()),
    status: scheduledPostStatusSchema.optional(),
    contentId: z.preprocess(
      (v) => (v === "" || v === null ? null : v),
      z.union([z.string().trim().min(1), z.null()]).optional()
    ),
  })
  .strict();

export const scheduledPostPatchSchema = scheduledPostCreateSchema.partial();

export type ScheduledPostCreateInput = z.infer<typeof scheduledPostCreateSchema>;

export function mongoFieldsFromScheduledPostCreate(parsed: ScheduledPostCreateInput): Record<string, unknown> {
  const d = new Date(parsed.publishDate);
  if (Number.isNaN(d.getTime())) throw new Error("Invalid publishDate");
  return {
    clientId: parsed.clientId,
    content: parsed.content,
    platform: parsed.platform,
    publishDate: d,
    timeZone: parsed.timeZone,
    status: parsed.status ?? "SCHEDULED",
    contentId: parsed.contentId ?? null,
  };
}

export function mongoFieldsFromScheduledPostPatch(
  parsed: z.infer<typeof scheduledPostPatchSchema>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (parsed.clientId !== undefined) out.clientId = parsed.clientId;
  if (parsed.content !== undefined) out.content = parsed.content;
  if (parsed.platform !== undefined) out.platform = parsed.platform;
  if (parsed.publishDate !== undefined) {
    const d = new Date(parsed.publishDate);
    if (Number.isNaN(d.getTime())) throw new Error("Invalid publishDate");
    out.publishDate = d;
  }
  if (parsed.timeZone !== undefined) out.timeZone = parsed.timeZone;
  if (parsed.status !== undefined) out.status = parsed.status;
  if (parsed.contentId !== undefined) out.contentId = parsed.contentId;
  return out;
}

export const templateUpsertSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    description: z.preprocess(emptyToUndef, z.string().trim().min(1).optional()),
    industry: z.preprocess(emptyToUndef, z.string().trim().min(1).optional()),
    tone: z.preprocess(emptyToUndef, z.string().trim().min(1).optional()),
    platform: z.preprocess(emptyToUndef, z.string().trim().min(1).optional()),
    suggestedCategory: z.preprocess(emptyToUndef, z.string().trim().min(1).optional()),
    suggestedLanguage: z.preprocess(emptyToUndef, z.string().trim().min(1).optional()),
    suggestedRatingStyle: z.preprocess(emptyToUndef, z.string().trim().min(1).optional()),
  })
  .strict();

export const templatePatchSchema = templateUpsertSchema.partial();

const optionalLoginPassword = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.string().min(8, "Password must be at least 8 characters").optional()
);

export const teamMemberCreateSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    email: z.string().trim().email("Valid email is required"),
    phone: z.string().trim().min(1).optional(),
    roleId: z.string().trim().min(1).optional(),
    department: z.string().trim().min(1).optional(),
    notes: z.string().trim().min(1).optional(),
    password: optionalLoginPassword,
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

