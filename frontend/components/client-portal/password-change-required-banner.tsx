import { ShieldAlert } from "lucide-react";

/** Shown on the profile page while a temporary password is still in use. */
export function PasswordChangeRequiredBanner() {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm"
    >
      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
      <div>
        <p className="font-semibold">Set your own password to continue</p>
        <p className="mt-1 text-muted-foreground">
          You signed in with a temporary password. Choose a new one below; the rest of the portal
          unlocks as soon as it is saved.
        </p>
      </div>
    </div>
  );
}
