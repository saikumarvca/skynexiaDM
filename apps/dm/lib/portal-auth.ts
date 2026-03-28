import crypto from 'crypto';

function getPortalSecret(): string {
  return process.env.AUTH_SECRET ?? 'portal-fallback-secret';
}

function hmacClientId(clientId: string): string {
  const secret = getPortalSecret();
  return crypto.createHmac('sha256', secret).update(`portal:${clientId}`).digest('hex');
}

/**
 * Generate a portal token for a client.
 * Token format: base64(clientId + ':' + hmac)
 */
export function generatePortalToken(clientId: string): string {
  const hmac = hmacClientId(clientId);
  const raw = `${clientId}:${hmac}`;
  return Buffer.from(raw, 'utf8').toString('base64url');
}

/**
 * Verify a portal token and return the clientId, or null if invalid.
 */
export function verifyPortalToken(token: string): string | null {
  try {
    const raw = Buffer.from(token, 'base64url').toString('utf8');
    const colonIdx = raw.indexOf(':');
    if (colonIdx === -1) return null;
    const clientId = raw.slice(0, colonIdx);
    const providedHmac = raw.slice(colonIdx + 1);
    if (!clientId || !providedHmac) return null;
    const expectedHmac = hmacClientId(clientId);
    // Constant-time comparison
    const a = Buffer.from(providedHmac, 'hex');
    const b = Buffer.from(expectedHmac, 'hex');
    if (a.length !== b.length) return null;
    if (!crypto.timingSafeEqual(a, b)) return null;
    return clientId;
  } catch {
    return null;
  }
}
