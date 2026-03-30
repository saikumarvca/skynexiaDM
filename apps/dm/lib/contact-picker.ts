/**
 * Web Contact Picker API — phone numbers only. Primarily Android Chrome over HTTPS.
 */

interface ContactsSelectOptions {
  multiple?: boolean;
}

interface ContactPickerResult {
  tel?: string[];
  email?: string[];
}

interface ContactsManager {
  select(
    properties: string[],
    options?: ContactsSelectOptions,
  ): Promise<ContactPickerResult[]>;
}

function getContactsManager(): ContactsManager | undefined {
  if (typeof navigator === "undefined") return undefined;
  const c = (
    navigator as Navigator & { contacts?: ContactsManager }
  ).contacts;
  if (!c || typeof c.select !== "function") return undefined;
  return c;
}

export function isContactPickerSupported(): boolean {
  return getContactsManager() !== undefined;
}

/**
 * Opens the system contact picker (tel only). Returns the first phone number or null.
 */
export async function pickContactPhone(): Promise<string | null> {
  const contacts = getContactsManager();
  if (!contacts) return null;

  const selected = await contacts.select(["tel"], { multiple: false });
  if (!selected?.length) return null;

  const tels = selected[0]?.tel;
  if (!tels?.length) return null;

  const raw = tels.find((t) => t && t.trim().length > 0)?.trim();
  return raw ?? null;
}
