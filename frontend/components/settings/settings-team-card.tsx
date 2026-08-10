"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Mail, Trash2, Users } from "lucide-react";

export type SettingsTeamMemberRow = {
  _id: string;
  name: string;
  email: string;
  roleName?: string;
};

type SettingsTeamCardProps = {
  members: SettingsTeamMemberRow[];
  isAdmin: boolean;
  currentUserEmail: string;
};

export function SettingsTeamCard({
  members: initialMembers,
  isAdmin,
  currentUserEmail,
}: SettingsTeamCardProps) {
  const router = useRouter();
  const [members, setMembers] = useState(initialMembers);
  const [dialogMember, setDialogMember] = useState<SettingsTeamMemberRow | null>(
    null,
  );
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setMembers(initialMembers);
  }, [initialMembers]);

  const norm = (e: string) => e.trim().toLowerCase();
  const isSelf = (email: string) => norm(email) === norm(currentUserEmail);

  async function handleConfirmDelete() {
    if (!dialogMember || confirmText !== "delete") return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/team/members/${dialogMember._id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "delete" }),
      });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Failed to remove team member");
        return;
      }
      toast.success(data.message ?? "Member archived");
      setMembers((prev) => prev.filter((m) => m._id !== dialogMember._id));
      setDialogMember(null);
      setConfirmText("");
      router.refresh();
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setDeleting(false);
    }
  }

  function openDelete(m: SettingsTeamMemberRow) {
    setDialogMember(m);
    setConfirmText("");
  }

  function onDialogOpenChange(open: boolean) {
    if (!open) {
      setDialogMember(null);
      setConfirmText("");
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team
          </CardTitle>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No team members yet. Add members from Team → Users.
            </p>
          ) : (
            <ul className="space-y-3">
              {members.map((u) => {
                const showDelete =
                  isAdmin && !isSelf(u.email);
                return (
                  <li
                    key={u._id}
                    className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{u.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                          <Mail className="h-3 w-3 shrink-0" />
                          {u.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                        {u.roleName ?? "—"}
                      </span>
                      {showDelete && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          title="Remove team member"
                          onClick={() => openDelete(u)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!dialogMember} onOpenChange={onDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove team member</DialogTitle>
            <DialogDescription>
              This archives{" "}
              <span className="font-medium text-foreground">
                {dialogMember?.name}
              </span>{" "}
              ({dialogMember?.email}). They will disappear from team lists and
              their dashboard login will be disabled. This cannot be undone from
              the UI.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label htmlFor="delete-confirm" className="text-sm font-medium">
              Type <span className="font-mono">delete</span> to confirm
            </label>
            <Input
              id="delete-confirm"
              autoComplete="off"
              placeholder="delete"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onDialogOpenChange(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={confirmText !== "delete" || deleting}
              onClick={handleConfirmDelete}
            >
              {deleting ? "Removing…" : "Remove member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
