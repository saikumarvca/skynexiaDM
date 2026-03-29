"use client";

import { useState } from "react";
import { toast } from "sonner";
import { User, KeyRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SettingsClientProps {
  initialName: string;
  email: string;
  role: string;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  CONTENT_WRITER: "Content Writer",
  DESIGNER: "Designer",
  ANALYST: "Analyst",
};

export function SettingsClient({
  initialName,
  email,
  role,
}: SettingsClientProps) {
  // Profile form state
  const [name, setName] = useState(initialName);
  const [profileLoading, setProfileLoading] = useState(false);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Name cannot be empty");
      return;
    }
    setProfileLoading(true);
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName }),
      });
      const data = (await res.json()) as { name?: string; error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Failed to update profile");
        return;
      }
      setName(data.name ?? trimmedName);
      toast.success("Profile updated successfully");
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setProfileLoading(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All password fields are required");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    setPasswordLoading(true);
    try {
      const res = await fetch("/api/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Failed to change password");
        return;
      }
      toast.success(data.message ?? "Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setPasswordLoading(false);
    }
  }

  return (
    <>
      {/* Profile card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="space-y-1">
              <label
                htmlFor="settings-name"
                className="text-sm font-medium leading-none"
              >
                Name
              </label>
              <Input
                id="settings-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                disabled={profileLoading}
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="settings-email"
                className="text-sm font-medium leading-none text-muted-foreground"
              >
                Email
              </label>
              <Input
                id="settings-email"
                value={email}
                readOnly
                disabled
                className="cursor-not-allowed bg-muted text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed here. Contact an admin to update your
                email.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium leading-none text-muted-foreground">
                Role
              </label>
              <div>
                <span className="inline-block rounded-full bg-muted px-3 py-1 text-xs font-medium">
                  {ROLE_LABELS[role] ?? role}
                </span>
              </div>
            </div>

            <Button type="submit" disabled={profileLoading} size="sm">
              {profileLoading ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change Password card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-1">
              <label
                htmlFor="settings-current-password"
                className="text-sm font-medium leading-none"
              >
                Current password
              </label>
              <Input
                id="settings-current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                disabled={passwordLoading}
                autoComplete="current-password"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="settings-new-password"
                className="text-sm font-medium leading-none"
              >
                New password
              </label>
              <Input
                id="settings-new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                disabled={passwordLoading}
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="settings-confirm-password"
                className="text-sm font-medium leading-none"
              >
                Confirm new password
              </label>
              <Input
                id="settings-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                disabled={passwordLoading}
                autoComplete="new-password"
              />
            </div>

            <Button type="submit" disabled={passwordLoading} size="sm">
              {passwordLoading ? "Updating…" : "Update password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
