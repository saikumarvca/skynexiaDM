"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { BookUser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  isContactPickerSupported,
  pickContactNameAndPhone,
} from "@/lib/contact-picker";

export interface CustomerContactInputRowProps {
  value: string;
  onChange: (value: string) => void;
  /** When set, picking a contact also fills Customer Name when the OS provides it. */
  onCustomerNameChange?: (name: string) => void;
  /** Applied to the "Customer Contact" label (margin differs across modals). */
  labelClassName?: string;
  placeholder?: string;
}

export function CustomerContactInputRow({
  value,
  onChange,
  onCustomerNameChange,
  labelClassName = "block text-sm font-medium mb-1",
  placeholder = "Email or phone",
}: CustomerContactInputRowProps) {
  const [picking, setPicking] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    setShowPicker(isContactPickerSupported());
  }, []);

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

  return (
    <div>
      <label className={labelClassName}>Customer Contact</label>
      <div className="flex items-center gap-2">
        <Input
          className="min-w-0 flex-1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
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
      </div>
    </div>
  );
}
