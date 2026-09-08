import { Building2, Globe, Mail, MapPin, Phone, UserRound } from "lucide-react";
import { requireClientSession } from "@/lib/client-portal/session";
import { formatDate } from "@/components/client-portal/format";
import { PortalPageHeader, SectionCard } from "@/components/client-portal/ui/primitives";
import { ClientIdentity } from "@/components/client-portal/shell/portal-sidebar";
import { ChangePasswordForm } from "@/components/client-portal/change-password-form";

export const dynamic = "force-dynamic";

export default async function ClientProfilePage() {
  const ctx = await requireClientSession();
  const c = ctx.client;

  const rows: { icon: typeof Mail; label: string; value?: string | null }[] = [
    { icon: Building2, label: "Business name", value: c.businessName },
    { icon: Building2, label: "Brand name", value: c.brandName },
    { icon: UserRound, label: "Primary contact", value: c.contactName },
    { icon: Mail, label: "Contact email", value: c.email },
    { icon: Phone, label: "Phone", value: c.phone },
    { icon: Globe, label: "Website", value: c.website },
    { icon: MapPin, label: "Location", value: c.location },
  ];

  return (
    <div className="space-y-6">
      <PortalPageHeader title="My Profile" subtitle="Your client account and sign-in details." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="space-y-4">
          <SectionCard title="Client Account">
            <ClientIdentity name={c.businessName || c.name} subtitle={`Client since ${formatDate(c.createdAt)}`} />
            <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {rows
                .filter((r) => r.value)
                .map((r) => {
                  const Icon = r.icon;
                  return (
                    <div key={r.label} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {r.label}
                        </dt>
                        <dd className="truncate text-sm font-medium">{r.value}</dd>
                      </div>
                    </div>
                  );
                })}
            </dl>
            <p className="mt-6 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              To change business details, contact your account manager. Changes are applied by your
              agency and appear in your change log.
            </p>
          </SectionCard>

          <SectionCard title="Sign-in">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Login email</dt>
                <dd className="mt-1 text-sm font-medium">{ctx.email}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Account name</dt>
                <dd className="mt-1 text-sm font-medium">{ctx.name}</dd>
              </div>
            </dl>
          </SectionCard>
        </div>

        <SectionCard
          title={<span id="password">Change Password</span>}
          description={
            ctx.isPreview
              ? "Password changes are disabled in preview mode."
              : "Choose a strong password you do not use elsewhere."
          }
        >
          <ChangePasswordForm disabled={ctx.isPreview} />
        </SectionCard>
      </div>
    </div>
  );
}
