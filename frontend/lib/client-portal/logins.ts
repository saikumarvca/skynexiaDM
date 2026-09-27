import crypto from "crypto";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import type { SessionUser } from "@/lib/auth";
import { recordClientPortalAudit } from "@/lib/client-portal/audit";
import { formatTemporaryPassword, type CreateClientLoginInput, type UpdateClientLoginInput } from "@/lib/client-portal/login-schema";
import { sendEmail } from "@/lib/email";
import { clientLoginInviteEmail, clientLoginPasswordResetEmail } from "@/lib/email-templates";

/** Staff-facing view of one CLIENT login. Never includes the password hash. */
export type ClientLogin = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

type Actor = Pick<SessionUser, "userId" | "name">;

type UserLean = {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  isActive: boolean;
  mustChangePassword?: boolean;
  lastLoginAt?: Date | null;
  createdAt: Date;
};

const SELECT = "_id name email isActive mustChangePassword lastLoginAt createdAt";

function toLogin(u: UserLean): ClientLogin {
  return {
    id: String(u._id),
    name: u.name,
    email: u.email,
    isActive: u.isActive,
    mustChangePassword: u.mustChangePassword === true,
    lastLoginAt: u.lastLoginAt ? new Date(u.lastLoginAt).toISOString() : null,
    createdAt: new Date(u.createdAt).toISOString(),
  };
}

function scope(clientId: string, userId?: string) {
  const filter: Record<string, unknown> = {
    role: "CLIENT",
    clientId: new mongoose.Types.ObjectId(clientId),
  };
  if (userId !== undefined) {
    if (!mongoose.isValidObjectId(userId)) return null;
    filter._id = new mongoose.Types.ObjectId(userId);
  }
  return filter;
}

export function generateTemporaryPassword(): string {
  return formatTemporaryPassword(crypto.randomBytes(16));
}

export function clientPortalLoginUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3152";
  return `${base.replace(/\/$/, "")}/client/login`;
}

function emailEnabled() {
  const provider = (process.env.EMAIL_PROVIDER ?? "none").toLowerCase();
  return provider === "smtp" || provider === "resend";
}

export async function listClientLogins(clientId: string): Promise<ClientLogin[]> {
  await dbConnect();
  const users = (await User.find(scope(clientId)!).select(SELECT).sort({ createdAt: 1 }).lean()) as unknown as UserLean[];
  return users.map(toLogin);
}

export class ClientLoginEmailTakenError extends Error {
  constructor() {
    super("A login with this email already exists");
  }
}

/**
 * Create a CLIENT login with a temporary password. The password is returned
 * once (for staff to hand over) and, when an email provider is configured and
 * `sendInvite` is set, emailed to the new login. The login must choose its own
 * password before it can use the portal.
 */
export async function createClientLogin(
  clientId: string,
  clientName: string,
  input: CreateClientLoginInput,
  actor: Actor,
): Promise<{ login: ClientLogin; temporaryPassword: string; emailSent: boolean }> {
  await dbConnect();
  const existing = await User.exists({ email: input.email });
  if (existing) throw new ClientLoginEmailTakenError();

  const temporaryPassword = generateTemporaryPassword();
  const doc = await User.create({
    email: input.email,
    name: input.name || clientName || input.email,
    role: "CLIENT",
    clientId: new mongoose.Types.ObjectId(clientId),
    passwordHash: await bcrypt.hash(temporaryPassword, 12),
    isActive: true,
    mustChangePassword: true,
  });
  const login = toLogin(doc.toObject() as UserLean);

  let emailSent = false;
  if (input.sendInvite && emailEnabled()) {
    const tpl = clientLoginInviteEmail({
      name: login.name,
      clientName,
      email: login.email,
      temporaryPassword,
      loginUrl: clientPortalLoginUrl(),
    });
    const result = await sendEmail({ to: login.email, ...tpl });
    emailSent = result.success;
    if (!result.success) console.error("Client login invite email failed:", result.error);
  }

  await recordClientPortalAudit({
    action: "CLIENT_LOGIN_CREATED",
    actor,
    clientId,
    targetName: login.email,
    details: { loginId: login.id, emailSent },
  });
  return { login, temporaryPassword, emailSent };
}

/** Rename or (de)activate a login. Deactivating also revokes its sessions. */
export async function updateClientLogin(
  clientId: string,
  userId: string,
  input: UpdateClientLoginInput,
  actor: Actor,
): Promise<ClientLogin | null> {
  const filter = scope(clientId, userId);
  if (!filter) return null;
  await dbConnect();

  const set: Record<string, unknown> = {};
  if (input.name !== undefined) set.name = input.name;
  if (input.isActive !== undefined) {
    set.isActive = input.isActive;
    if (!input.isActive) set.sessionsRevokedAt = new Date();
  }
  const doc = (await User.findOneAndUpdate(filter, { $set: set }, { new: true })
    .select(SELECT)
    .lean()) as unknown as UserLean | null;
  if (!doc) return null;

  await recordClientPortalAudit({
    action: "CLIENT_LOGIN_UPDATED",
    actor,
    clientId,
    targetName: doc.email,
    details: { loginId: String(doc._id), changed: Object.keys(set) },
  });
  return toLogin(doc);
}

/**
 * Issue a new temporary password. Every existing session of the login is
 * signed out and the login must pick its own password at the next sign-in.
 */
export async function resetClientLoginPassword(
  clientId: string,
  userId: string,
  clientName: string,
  actor: Actor,
  options: { sendEmail?: boolean } = {},
): Promise<{ login: ClientLogin; temporaryPassword: string; emailSent: boolean } | null> {
  const filter = scope(clientId, userId);
  if (!filter) return null;
  await dbConnect();

  const temporaryPassword = generateTemporaryPassword();
  const now = new Date();
  const doc = (await User.findOneAndUpdate(
    filter,
    {
      $set: {
        passwordHash: await bcrypt.hash(temporaryPassword, 12),
        mustChangePassword: true,
        passwordChangedAt: now,
        sessionsRevokedAt: now,
      },
    },
    { new: true },
  )
    .select(SELECT)
    .lean()) as unknown as UserLean | null;
  if (!doc) return null;
  const login = toLogin(doc);

  let emailSent = false;
  if (options.sendEmail !== false && emailEnabled()) {
    const tpl = clientLoginPasswordResetEmail({
      name: login.name,
      clientName,
      temporaryPassword,
      loginUrl: clientPortalLoginUrl(),
    });
    const result = await sendEmail({ to: login.email, ...tpl });
    emailSent = result.success;
    if (!result.success) console.error("Client login reset email failed:", result.error);
  }

  await recordClientPortalAudit({
    action: "CLIENT_LOGIN_PASSWORD_RESET",
    actor,
    clientId,
    targetName: login.email,
    details: { loginId: login.id, emailSent },
  });
  return { login, temporaryPassword, emailSent };
}
