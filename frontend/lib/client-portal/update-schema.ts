import { z } from "zod";
import type { ClientUpdateCategory } from "@/models/ClientUpdate";

// Kept here (type-only import above) so the schema has no model/DB imports.
export const CLIENT_UPDATE_CATEGORIES = [
  "ANNOUNCEMENT",
  "PROGRESS",
  "FEATURE",
  "MAINTENANCE",
  "REPORTING",
] as const satisfies readonly ClientUpdateCategory[];

const fields = {
  title: z.string().trim().min(1).max(160),
  body: z.string().trim().min(1).max(5000),
  category: z.enum(CLIENT_UPDATE_CATEGORIES),
  isPublished: z.boolean(),
  relatedReviewId: z.string().trim().max(64).nullable().optional(),
  relatedLabel: z.string().trim().max(160).nullable().optional(),
  linkUrl: z
    .string()
    .trim()
    .max(2000)
    .refine((v) => !v || /^https?:\/\//i.test(v), "Link must start with http(s)://")
    .nullable()
    .optional(),
  linkLabel: z.string().trim().max(120).nullable().optional(),
};

/** Body of POST /api/clients/[clientId]/portal/updates. */
export const clientUpdateSchema = z
  .object({
    ...fields,
    category: fields.category.default("ANNOUNCEMENT"),
    isPublished: fields.isPublished.default(true),
  })
  .strict();

/**
 * Body of PATCH /api/clients/[clientId]/portal/updates/[updateId]. Built from
 * the fields without defaults: zod 4 applies `.default()` even under
 * `.partial()`, which would publish drafts and reset the category on every
 * partial edit.
 */
export const clientUpdatePatchSchema = z.object(fields).partial().strict();
