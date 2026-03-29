const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 10;

interface AttemptRecord {
  count: number;
  windowStart: number;
}

const attempts = new Map<string, AttemptRecord>();

export function checkRateLimit(ip: string): {
  allowed: boolean;
  retryAfter?: number;
} {
  const now = Date.now();
  const record = attempts.get(ip);

  if (!record || now - record.windowStart >= WINDOW_MS) {
    attempts.set(ip, { count: 1, windowStart: now });
    return { allowed: true };
  }

  if (record.count >= MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((record.windowStart + WINDOW_MS - now) / 1000);
    return { allowed: false, retryAfter };
  }

  record.count += 1;
  return { allowed: true };
}
