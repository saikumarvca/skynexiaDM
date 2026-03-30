/**
 * Web Contact Picker API — name + phone (no email). Primarily Android Chrome over HTTPS.
 */

interface ContactsSelectOptions {
  multiple?: boolean;
}

interface ContactPickerResult {
  name?: string[];
  tel?: string[];
  email?: string[];
}

export type PickContactOutcome =
  | { status: "cancelled" }
  | {
      status: "picked";
      name: string | null;
      phone: string | null;
    };

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

function firstNonEmpty(values: string[] | undefined): string | null {
  if (!values?.length) return null;
  const raw = values.find((v) => v && v.trim().length > 0)?.trim();
  return raw ?? null;
}

/**
 * Opens the system contact picker for display name and phone. Does not request email.
 * Empty array means the user dismissed the dialog (`status: "cancelled"`).
 */
export async function pickContactNameAndPhone(): Promise<PickContactOutcome> {
  const contacts = getContactsManager();
  if (!contacts) {
    return { status: "cancelled" };
  }

  const selected = await contacts.select(["name", "tel"], { multiple: false });
  if (!selected?.length) {
    return { status: "cancelled" };
  }

  const row = selected[0];
  return {
    status: "picked",
    name: firstNonEmpty(row?.name),
    phone: firstNonEmpty(row?.tel),
  };
}
