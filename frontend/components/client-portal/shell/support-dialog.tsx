"use client";

import { useState } from "react";
import { Headset, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type SupportContact = { email?: string; phone?: string; name?: string };

/** "Need help?" block at the bottom of the sidebar. */
export function SupportCard({
  contact,
  compact = false,
}: {
  contact: SupportContact;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="rounded-xl border border-border/80 bg-muted/40 p-3.5">
        <div className="flex items-start gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Headset className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight">Need Help?</p>
            {!compact && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Contact your account manager
              </p>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-3 w-full border-primary/40 text-primary hover:bg-primary/10 hover:text-primary"
          onClick={() => setOpen(true)}
        >
          Contact Support
        </Button>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Contact Support</DialogTitle>
            <DialogDescription>
              Your account manager is happy to help with reviews, reporting or
              access to this portal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            {contact.name ? (
              <p className="font-medium">{contact.name}</p>
            ) : null}
            {contact.email ? (
              <a
                href={`mailto:${contact.email}`}
                className="flex items-center gap-2 rounded-lg border p-3 text-foreground no-underline hover:bg-muted"
              >
                <Mail className="h-4 w-4 text-primary" aria-hidden />
                {contact.email}
              </a>
            ) : null}
            {contact.phone ? (
              <a
                href={`tel:${contact.phone}`}
                className="flex items-center gap-2 rounded-lg border p-3 text-foreground no-underline hover:bg-muted"
              >
                <Phone className="h-4 w-4 text-primary" aria-hidden />
                {contact.phone}
              </a>
            ) : null}
            {!contact.email && !contact.phone ? (
              <p className="text-muted-foreground">
                Reach out to your agency contact through your usual channel. Support
                details will appear here once your agency configures them.
              </p>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
