import { z } from "zod";
import { CLIENT_UPDATE_CATEGORIES } from "@/lib/client-portal/updates";

/** Body of POST/PATCH /api/clients/[clientId]/portal/updates. */
export const clientUpdateSchema = z
  .object({
    title: z.string().trim().min(1).max(160),
    body: z.string().trim().min(1).max(5000),
    category: z.enum(CLIENT_UPDATE_CATEGORIES).default("ANNOUNCEMENT"),
    isPublished: z.boolean().default(true),
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
  })
  .strict();

export const clientUpdatePatchSchema = clientUpdateSchema.partial();
