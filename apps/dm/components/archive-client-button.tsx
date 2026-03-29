"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Archive, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ArchiveClientButtonProps {
  clientId: string;
  clientName: string;
  disabled?: boolean;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "outline" | "ghost" | "secondary";
}

export function ArchiveClientButton({
  clientId,
  clientName,
  disabled,
  className,
  size = "icon",
  variant = "outline",
}: ArchiveClientButtonProps) {
  const router = useRouter();
  const [archiving, setArchiving] = useState(false);
  const [open, setOpen] = useState(false);

  async function confirmArchive() {
    setArchiving(true);
    try {
      const res = await fetch(`/api/clients/${clientId}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Request failed");
      }
      toast.success(`Archived ${clientName}`);
      setOpen(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Failed to archive client",
      );
    } finally {
      setArchiving(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={cn(
          size === "icon" &&
            "h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive",
          className,
        )}
        disabled={disabled || archiving}
        title="Archive client"
        aria-label={`Archive ${clientName}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
      >
        {archiving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Archive className="h-4 w-4" />
        )}
      </Button>

      <Dialog open={open} onOpenChange={(next) => !archiving && setOpen(next)}>
        <DialogContent className="gap-6 border-border/80 bg-card/95 shadow-xl backdrop-blur-sm sm:max-w-md">
          <DialogHeader className="items-center space-y-4 text-center sm:text-center">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-sm ring-1 ring-primary/10"
              aria-hidden
            >
              <Archive className="h-7 w-7" strokeWidth={1.5} />
            </div>
            <div className="space-y-2">
              <DialogTitle className="text-xl font-semibold tracking-tight">
                Archive{" "}
                <span className="whitespace-nowrap text-primary">
                  “{clientName}”
                </span>
                ?
              </DialogTitle>
              <DialogDescription className="text-base leading-relaxed text-muted-foreground">
                They will leave your main client list. Nothing is deleted — you
                can still open them from archived clients whenever you need.
              </DialogDescription>
            </div>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end sm:gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={archiving}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" disabled={archiving} onClick={confirmArchive}>
              {archiving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Archiving…
                </>
              ) : (
                <>
                  <Archive className="mr-2 h-4 w-4" />
                  Archive client
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
