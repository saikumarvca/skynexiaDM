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

/** E.164-style `tel:` URI for the device dialer; null if contact is not a dialable phone. */
export function telHrefFromContact(contact: string): string | null {
  const digits = parseWhatsAppDigits(contact);
  if (!digits) return null;
  return `tel:+${digits}`;
}

export function openTelCall(contact: string): void {
  const href = telHrefFromContact(contact);
  if (!href) return;
  window.location.assign(href);
}

/** Polite follow-up asking whether the review was posted (WhatsApp). */
export function buildReviewPostedFollowUpMessage(
  customerDisplayName: string,
): string {
  const name = customerDisplayName.trim() || "there";
  return `Hey ${name}, hope you're doing well. I'm following up to check whether you've had a chance to post the review yet. If you've already posted it, please feel free to ignore this message. Thank you!`;
}
