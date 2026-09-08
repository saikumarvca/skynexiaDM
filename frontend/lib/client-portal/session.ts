import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse, type NextRequest } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { verifyClientPreviewToken, verifySessionToken } from "@/lib/auth";
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
  previewActor?: { userId: string; name: string; email: string; role: string };
};

export const CLIENT_LOGIN_PATH = "/client/login";
export const CLIENT_HOME_PATH = "/client/dashboard";

async function resolveFromPreview(
  claims: { uid: string; cid: string },
): Promise<ClientContext | null> {
  if (!mongoose.isValidObjectId(claims.uid)) return null;

  await dbConnect();
  const actor = await User.findById(claims.uid)
    .select("_id email name role isActive")
    .lean();
  // Only active internal accounts may preview; a CLIENT login cannot borrow
  // another client's view through a preview cookie.
  if (!actor || !actor.isActive || actor.role === "CLIENT") return null;

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
    .select("_id email name role isActive clientId")
    .lean();
  if (!user || !user.isActive || user.role !== "CLIENT" || !user.clientId) {
    return null;
  }

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
      const ctx = await resolveFromPreview(claims);
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

/** Server pages: the client context, or a redirect to the client sign-in. */
export async function requireClientSession(): Promise<ClientContext> {
  const ctx = await getCurrentClientContext();
  if (!ctx) redirect(CLIENT_LOGIN_PATH);
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

/** ObjectId for the authenticated client; use it in every portal query. */
export function clientObjectId(ctx: ClientContext) {
  return new mongoose.Types.ObjectId(ctx.clientId);
}
