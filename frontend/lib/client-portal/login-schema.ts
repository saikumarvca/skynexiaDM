import { z } from "zod";

/**
 * Request bodies for staff-managed client logins
 * (/api/clients/[clientId]/portal/users). No model or DB imports so the
 * schemas can be unit-tested on their own.
 */

const email = z.string().trim().toLowerCase().email().max(254);
const name = z.string().trim().min(1).max(120);

/** POST /api/clients/[clientId]/portal/users */
export const createClientLoginSchema = z
  .object({
    email,
    /** Defaults to the client's business name. */
    name: name.optional(),
    /** Send the temporary password by email when an email provider is configured. */
    sendInvite: z.boolean().default(true),
  })
  .strict();

/** PATCH /api/clients/[clientId]/portal/users/[userId] */
export const updateClientLoginSchema = z
  .object({
    name: name.optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine((v) => v.name !== undefined || v.isActive !== undefined, {
    message: "Nothing to update",
  });

export type CreateClientLoginInput = z.infer<typeof createClientLoginSchema>;
export type UpdateClientLoginInput = z.infer<typeof updateClientLoginSchema>;

/**
 * Temporary password shown once to staff / emailed to the client. 16 chars
 * from an alphabet without look-alikes (0/O, 1/l/I), grouped for reading.
 */
export const TEMP_PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

export function formatTemporaryPassword(randomBytes: Uint8Array): string {
  const chars: string[] = [];
  for (let i = 0; i < 16; i++) {
    const byte = randomBytes[i % randomBytes.length] ?? 0;
    chars.push(TEMP_PASSWORD_ALPHABET[byte % TEMP_PASSWORD_ALPHABET.length]!);
  }
  return `${chars.slice(0, 4).join("")}-${chars.slice(4, 8).join("")}-${chars.slice(8, 12).join("")}-${chars.slice(12).join("")}`;
}
