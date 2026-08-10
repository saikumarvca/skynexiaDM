"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Eye, EyeOff } from "lucide-react";

interface TeamMemberFormProps {
  memberId?: string;
  /** Whether this member’s email already has a dashboard login (password set). */
  hasLogin?: boolean;
  initialData?: {
    name: string;
    email: string;
    phone?: string;
    roleId?: string;
    department?: string;
    notes?: string;
    accountType?: "MAIN_EMPLOYEE" | "PARTNER_AGENCY" | "PARTNER_EMPLOYEE";
    partnerAgencyId?: string;
    reportsToUserId?: string;
  };
  roles: { _id: string; roleName: string }[];
  partnerAgencies?: { _id: string; name: string }[];
  managers?: { _id: string; name: string }[];
}

export function TeamMemberForm({
  memberId,
  hasLogin = false,
  initialData,
  roles,
  partnerAgencies = [],
  managers = [],
}: TeamMemberFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialData?.name ?? "");
  const [email, setEmail] = useState(initialData?.email ?? "");
  const [phone, setPhone] = useState(initialData?.phone ?? "");
  const [roleId, setRoleId] = useState(initialData?.roleId ?? "");
  const [department, setDepartment] = useState(initialData?.department ?? "");
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [accountType, setAccountType] = useState<
    "MAIN_EMPLOYEE" | "PARTNER_AGENCY" | "PARTNER_EMPLOYEE"
  >(initialData?.accountType ?? "MAIN_EMPLOYEE");
  const [partnerAgencyId, setPartnerAgencyId] = useState(
    initialData?.partnerAgencyId ?? "",
  );
  const [reportsToUserId, setReportsToUserId] = useState(
    initialData?.reportsToUserId ?? "",
  );
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const pw = password.trim();
    const pw2 = passwordConfirm.trim();
    if (pw || pw2) {
      if (!pw) {
        setError("Enter a password, or clear both password fields.");
        return;
      }
      if (pw.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
      if (pw !== pw2) {
        setError("Passwords do not match.");
        return;
      }
    }
    setLoading(true);
    try {
      const url = memberId
        ? `/api/team/members/${memberId}`
        : `/api/team/members`;
      const method = memberId ? "PATCH" : "POST";
      const body: Record<string, unknown> = {
        name,
        email,
        phone: phone || undefined,
        roleId: roleId || undefined,
        department: department || undefined,
        notes: notes || undefined,
        accountType,
        partnerAgencyId:
          accountType === "MAIN_EMPLOYEE" ? undefined : partnerAgencyId || undefined,
        reportsToUserId: reportsToUserId || undefined,
      };
      if (pw) body.password = pw;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      router.push("/team/members");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 px-4 py-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
      <div>
        <label
          htmlFor="name"
          className="mb-1 block text-sm font-medium text-muted-foreground"
        >
          Name *
        </label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <label
          htmlFor="email"
          className="mb-1 block text-sm font-medium text-muted-foreground"
        >
          Email *
        </label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={!!memberId}
        />
      </div>
      <div>
        <label
          htmlFor="phone"
          className="mb-1 block text-sm font-medium text-muted-foreground"
        >
          Phone
        </label>
        <Input
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>
      <div>
        <label
          htmlFor="roleId"
          className="mb-1 block text-sm font-medium text-muted-foreground"
        >
          Role
        </label>
        <select
          id="roleId"
          value={roleId}
          onChange={(e) => setRoleId(e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
        >
          <option value="">Select role</option>
          {roles.map((r) => (
            <option key={r._id} value={r._id}>
              {r.roleName}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label
          htmlFor="department"
          className="mb-1 block text-sm font-medium text-muted-foreground"
        >
          Department
        </label>
        <Input
          id="department"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        />
      </div>
      <div>
        <label
          htmlFor="accountType"
          className="mb-1 block text-sm font-medium text-muted-foreground"
        >
          Account Type
        </label>
        <select
          id="accountType"
          value={accountType}
          onChange={(e) =>
            setAccountType(
              e.target.value as
                | "MAIN_EMPLOYEE"
                | "PARTNER_AGENCY"
                | "PARTNER_EMPLOYEE",
            )
          }
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
        >
          <option value="MAIN_EMPLOYEE">Main employee</option>
          <option value="PARTNER_AGENCY">Partner agency account</option>
          <option value="PARTNER_EMPLOYEE">Partner agency employee</option>
        </select>
      </div>
      {accountType !== "MAIN_EMPLOYEE" && (
        <div>
          <label
            htmlFor="partnerAgencyId"
            className="mb-1 block text-sm font-medium text-muted-foreground"
          >
            Partner Agency *
          </label>
          <select
            id="partnerAgencyId"
            value={partnerAgencyId}
            onChange={(e) => setPartnerAgencyId(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            required
          >
            <option value="">Select partner agency</option>
            {partnerAgencies.map((agency) => (
              <option key={agency._id} value={agency._id}>
                {agency.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label
          htmlFor="reportsToUserId"
          className="mb-1 block text-sm font-medium text-muted-foreground"
        >
          Reports To
        </label>
        <select
          id="reportsToUserId"
          value={reportsToUserId}
          onChange={(e) => setReportsToUserId(e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
        >
          <option value="">None</option>
          {managers.map((manager) => (
            <option key={manager._id} value={manager._id}>
              {manager.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label
          htmlFor="notes"
          className="mb-1 block text-sm font-medium text-muted-foreground"
        >
          Notes
        </label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>
      <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-4">
        <div>
          <p className="text-sm font-medium text-foreground">Dashboard login</p>
          <p className="text-xs text-muted-foreground mt-1">
            {memberId
              ? hasLogin
                ? "This member can sign in. Enter a new password below to change it."
                : "No password yet — set one so they can sign in at the login page with this email."
              : "Optional: set a password so this member can sign in with their email."}
          </p>
        </div>
        <div>
          <label
            htmlFor="login-password"
            className="mb-1 block text-sm font-medium text-muted-foreground"
          >
            {memberId ? "New password" : "Password"}
          </label>
          <div className="relative">
            <Input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={
                memberId
                  ? "Leave blank to keep current"
                  : "Min. 8 characters if enabling login"
              }
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
        <div>
          <label
            htmlFor="login-password-confirm"
            className="mb-1 block text-sm font-medium text-muted-foreground"
          >
            Confirm password
          </label>
          <div className="relative">
            <Input
              id="login-password-confirm"
              type={showPasswordConfirm ? "text" : "password"}
              autoComplete="new-password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="Repeat password"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPasswordConfirm((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
              aria-label={
                showPasswordConfirm ? "Hide confirm password" : "Show confirm password"
              }
            >
              {showPasswordConfirm ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
