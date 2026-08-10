"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { BookUser, Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  isContactPickerSupported,
  pickContactNameAndPhone,
} from "@/lib/contact-picker";

type ContactBookEntryLite = {
  _id: string;
  displayName: string;
  phone?: string;
  email?: string;
};

export interface CustomerContactInputRowProps {
  value: string;
  onChange: (value: string) => void;
  /** When set, picking a contact also fills Customer Name when the OS provides it. */
  onCustomerNameChange?: (name: string) => void;
  /** Overrides the default "Customer Contact" label. */
  label?: string;
  /** Applied to the contact label (margin differs across modals). */
  labelClassName?: string;
  placeholder?: string;
  /** Show "From my book" popover (uses `/api/contact-book`). */
  showContactBookPicker?: boolean;
  /** If set, only entries with at least one of these tags (exact API filter). */
  contactBookFilterTags?: string[];
  /** Icons/buttons after the device contact picker (e.g. Call / WhatsApp). */
  endAdornment?: React.ReactNode;
}

export function CustomerContactInputRow({
  value,
  onChange,
  onCustomerNameChange,
  label = "Customer Contact",
  labelClassName = "block text-sm font-medium mb-1",
  placeholder = "Email or phone",
  showContactBookPicker = true,
  contactBookFilterTags,
  endAdornment,
}: CustomerContactInputRowProps) {
  const [picking, setPicking] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  const [bookLoading, setBookLoading] = useState(false);
  const [bookEntries, setBookEntries] = useState<ContactBookEntryLite[]>([]);

  useEffect(() => {
    setShowPicker(isContactPickerSupported());
  }, []);

  const tagsKey =
    contactBookFilterTags?.length ?
      contactBookFilterTags.join("\0")
    : "";

  useEffect(() => {
    if (!bookOpen || !showContactBookPicker) return;
    let cancelled = false;
    setBookLoading(true);
    const q = new URLSearchParams();
    if (contactBookFilterTags?.length) {
      q.set("tags", contactBookFilterTags.join(","));
    }
    fetch(`/api/contact-book?${q.toString()}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("load");
        return (await res.json()) as ContactBookEntryLite[];
      })
      .then((data) => {
        if (!cancelled) setBookEntries(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) {
          setBookEntries([]);
          toast.error("Could not load your contact book.");
        }
      })
      .finally(() => {
        if (!cancelled) setBookLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bookOpen, showContactBookPicker, tagsKey]);

  const handlePickContact = useCallback(async () => {
    setPicking(true);
    try {
      const outcome = await pickContactNameAndPhone();
      if (outcome.status === "cancelled") return;
      const { name, phone } = outcome;
      if (name && onCustomerNameChange) onCustomerNameChange(name);
      if (phone) onChange(phone);
      if (!name && !phone) {
        toast.message(
          "No name or phone on that contact. Try another or enter manually.",
        );
      }
    } catch {
      toast.error("Could not open contacts. Try again or enter details manually.");
    } finally {
      setPicking(false);
    }
  }, [onChange, onCustomerNameChange]);

  const applyFromBook = useCallback(
    (entry: ContactBookEntryLite) => {
      const phoneOrEmail =
        (entry.phone && entry.phone.trim()) ||
        (entry.email && entry.email.trim()) ||
        "";
      if (phoneOrEmail) onChange(phoneOrEmail);
      else {
        toast.message("That contact has no phone or email saved.");
        return;
      }
      if (onCustomerNameChange && entry.displayName.trim()) {
        onCustomerNameChange(entry.displayName.trim());
      }
      setBookOpen(false);
    },
    [onChange, onCustomerNameChange],
  );

  return (
    <div>
      <label className={labelClassName}>{label}</label>
      <div className="flex items-center gap-2">
        <Input
          className="min-w-0 flex-1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
        {showContactBookPicker ? (
          <Popover open={bookOpen} onOpenChange={setBookOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0"
                title="Pick from my contact book"
                aria-label="Pick from my contact book"
              >
                <Library className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-72 p-0"
              align="end"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <div className="border-b px-3 py-2 text-xs font-medium text-muted-foreground">
                My contact book
              </div>
              <div className="max-h-56 overflow-y-auto py-1">
                {bookLoading ? (
                  <p className="px-3 py-4 text-sm text-muted-foreground">
                    Loading…
                  </p>
                ) : bookEntries.length === 0 ? (
                  <p className="px-3 py-4 text-sm text-muted-foreground">
                    No saved contacts
                    {contactBookFilterTags?.length ?
                      " with this tag."
                    : "."}{" "}
                    Add some under Contact book in the sidebar.
                  </p>
                ) : (
                  bookEntries.map((e) => (
                    <button
                      key={e._id}
                      type="button"
                      className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-muted"
                      onClick={() => applyFromBook(e)}
                    >
                      <span className="font-medium">{e.displayName}</span>
                      <span className="text-xs text-muted-foreground">
                        {e.phone || e.email || "—"}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>
        ) : null}
        {showPicker ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0"
            disabled={picking}
            onClick={handlePickContact}
            title="Load name and phone from contacts"
            aria-label="Load customer name and phone number from contacts"
          >
            <BookUser className="h-4 w-4" />
          </Button>
        ) : null}
        {endAdornment}
      </div>
    </div>
  );
}
