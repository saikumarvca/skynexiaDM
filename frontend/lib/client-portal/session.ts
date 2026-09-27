import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse, type NextRequest } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import {
  createSessionToken,
  isSessionRevoked,
  verifyClientPreviewToken,
  verifySessionToken,
} from "@/lib/auth";
import { SESSION_MAX_AGE_SECONDS } from "@/lib/session-cookie";
import {
  DM_CLIENT_PREVIEW_COOKIE_NAME,
  DM_SESSION_COOKIE_NAME,
} from "@/lib/session-cookie-name";
import { loadPortalClient, type PortalClient } from "@/lib/client-portal/client";

/**
 * Authenticated client-portal context. Everything the portal reads is scoped
 * by `clientId`, which comes from the signed session (never from the URL or
 * request body).
 *
 * Two ways to obtain a context:
 *  - a CLIENT login (User.role === "CLIENT" linked to one client);
 *  - an internal user holding a short-lived preview cookie (isPreview=true),
 *    in which case `userId` is the previewing user and the portal is
 *    read-only.
 */
export type ClientContext = {
  userId: string;
  email: string;
  name: string;
  clientId: string;
  clientName: string;
  businessName: string;
  brandName: string;
  client: PortalClient;
  isPreview: boolean;
  /** The login must set a new password before using the portal. */
  mustChangePassword: boolean;
  previewActor?: { userId: string; name: string; email: string; role: string };
};

export const CLIENT_LOGIN_PATH = "/client/login";
export const CLIENT_HOME_PATH = "/client/dashboard";
/** Where a login with a temporary password is sent until it picks its own. */
export const CLIENT_PASSWORD_CHANGE_PATH = "/client/profile?reason=password#password";

/** Client APIs that stay usable while a password change is pending. */
const PASSWORD_CHANGE_ALLOWED_APIS = new Set([
  "/api/client/profile",
  "/api/client/profile/password",
  "/api/client/preview/exit",
]);

async function resolveFromPreview(
  claims: { uid: string; cid: string },
  session: { iat?: number },
): Promise<ClientContext | null> {
  if (!mongoose.isValidObjectId(claims.uid)) return null;

  await dbConnect();
  const actor = await User.findById(claims.uid)
    .select("_id email name role isActive sessionsRevokedAt")
    .lean();
  // Only active internal accounts may preview; a CLIENT login cannot borrow
  // another client's view through a preview cookie.
  if (!actor || !actor.isActive || actor.role === "CLIENT") return null;
  if (isSessionRevoked(session, actor.sessionsRevokedAt)) return null;

  const client = await loadPortalClient(claims.cid);
  if (!client) return null;

  return {
    userId: String(actor._id),
    email: actor.email,
    name: actor.name,
    clientId: client.id,
    clientName: client.name,
    businessName: client.businessName,
    brandName: client.brandName,
    client,
    isPreview: true,
    mustChangePassword: false,
    previewActor: {
      userId: String(actor._id),
      name: actor.name,
      email: actor.email,
      role: actor.role,
    },
  };
}

async function resolveFromSession(
  sessionToken: string | undefined,
): Promise<ClientContext | null> {
  if (!sessionToken) return null;
  const payload = verifySessionToken(sessionToken);
  if (!payload || payload.typ || !mongoose.isValidObjectId(payload.uid)) {
    return null;
  }

  await dbConnect();
  const user = await User.findById(payload.uid)
    .select("_id email name role isActive clientId sessionsRevokedAt mustChangePassword")
    .lean();
  if (!user || !user.isActive || user.role !== "CLIENT" || !user.clientId) {
    return null;
  }
  if (isSessionRevoked(payload, user.sessionsRevokedAt)) return null;

  // The client comes from the user record, never from the token alone.
  const client = await loadPortalClient(String(user.clientId));
  if (!client) return null;

  return {
    userId: String(user._id),
    email: user.email,
    name: user.name,
    clientId: client.id,
    clientName: client.name,
    businessName: client.businessName,
    brandName: client.brandName,
    client,
    isPreview: false,
    mustChangePassword: user.mustChangePassword === true,
  };
}

/**
 * A preview cookie is only honoured next to the internal session that created
 * it (same uid, not a CLIENT login). A client login therefore always resolves
 * to its own client, whatever other cookies the browser carries.
 */
async function resolveClientContext(
  sessionToken: string | undefined,
  previewToken: string | undefined,
): Promise<ClientContext | null> {
  if (previewToken && sessionToken) {
    const claims = verifyClientPreviewToken(previewToken);
    const session = verifySessionToken(sessionToken);
    if (
      claims &&
      session &&
      !session.typ &&
      session.role !== "CLIENT" &&
      session.uid === claims.uid
    ) {
      const ctx = await resolveFromPreview(claims, session);
      if (ctx) return ctx;
    }
  }
  return resolveFromSession(sessionToken);
}

async function loadClientContextFromCookies(): Promise<ClientContext | null> {
  const jar = await cookies();
  return resolveClientContext(
    jar.get(DM_SESSION_COOKIE_NAME)?.value,
    jar.get(DM_CLIENT_PREVIEW_COOKIE_NAME)?.value,
  );
}

/** Per-request cached context for server components and layouts. */
export const getCurrentClientContext = cache(loadClientContextFromCookies);

/**
 * Server pages: the client context, or a redirect to the client sign-in.
 * A login that must still change its password is sent to the profile page;
 * the layout and the profile page itself pass `allowPasswordChangeRequired`.
 */
export async function requireClientSession(options?: {
  allowPasswordChangeRequired?: boolean;
}): Promise<ClientContext> {
  const ctx = await getCurrentClientContext();
  if (!ctx) redirect(CLIENT_LOGIN_PATH);
  if (ctx.mustChangePassword && !options?.allowPasswordChangeRequired) {
    redirect(CLIENT_PASSWORD_CHANGE_PATH);
  }
  return ctx;
}

export async function getClientContextFromRequest(
  req: NextRequest,
): Promise<ClientContext | null> {
  return resolveClientContext(
    req.cookies.get(DM_SESSION_COOKIE_NAME)?.value,
    req.cookies.get(DM_CLIENT_PREVIEW_COOKIE_NAME)?.value,
  );
}

export type ClientApiAuth =
  | { ctx: ClientContext; denied: null }
  | { ctx: null; denied: NextResponse };

/** API routes: resolve the client context or produce the 401 response. */
export async function requireClientSessionApi(
  req: NextRequest,
): Promise<ClientApiAuth> {
  try {
    const ctx = await getClientContextFromRequest(req);
    if (!ctx) {
      return {
        ctx: null,
        denied: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      };
    }
    if (ctx.mustChangePassword && !PASSWORD_CHANGE_ALLOWED_APIS.has(req.nextUrl.pathname)) {
      return {
        ctx: null,
        denied: NextResponse.json(
          {
            error: "Please set a new password before continuing",
            code: "PASSWORD_CHANGE_REQUIRED",
            redirectTo: CLIENT_PASSWORD_CHANGE_PATH,
          },
          { status: 403 },
        ),
      };
    }
    return { ctx, denied: null };
  } catch {
    return {
      ctx: null,
      denied: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
}

/** Mutations are disabled while an internal user previews the portal. */
export function denyIfPreview(ctx: ClientContext): NextResponse | null {
  if (!ctx.isPreview) return null;
  return NextResponse.json(
    { error: "Preview mode is read-only", code: "PREVIEW_READ_ONLY" },
    { status: 403 },
  );
}

/**
 * A new session token for the signed-in client login, issued now. Used after
 * a password change or "sign out everywhere" so the current browser survives
 * the revocation of every earlier token.
 */
export function freshClientSessionToken(ctx: ClientContext): string {
  const nowSec = Math.floor(Date.now() / 1000);
  return createSessionToken({
    uid: ctx.userId,
    cid: ctx.clientId,
    role: "CLIENT",
    iat: nowSec,
    exp: nowSec + SESSION_MAX_AGE_SECONDS,
  });
}

/** ObjectId for the authenticated client; use it in every portal query. */
export function clientObjectId(ctx: ClientContext) {
  return new mongoose.Types.ObjectId(ctx.clientId);
}
