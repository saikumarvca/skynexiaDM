const MIN_DIGITS = 8;
const MAX_DIGITS = 15;

/**
 * Returns digits-only international number for wa.me, or null if contact looks like email or is invalid.
 */
export function parseWhatsAppDigits(contact: string): string | null {
  const raw = contact.trim();
  if (!raw || raw.includes("@")) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length < MIN_DIGITS || digits.length > MAX_DIGITS) return null;
  return digits;
}

export function buildWhatsAppUrl(phoneDigits: string, message: string): string {
  return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;
}

export function openWhatsAppChat(phoneDigits: string, message: string): void {
  window.open(
    buildWhatsAppUrl(phoneDigits, message),
    "_blank",
    "noopener,noreferrer",
  );
}
