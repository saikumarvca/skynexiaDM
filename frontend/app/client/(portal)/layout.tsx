import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import Notification from "@/models/Notification";
import ClientUpdate from "@/models/ClientUpdate";
import { requireClientSession } from "@/lib/client-portal/session";
import { clientNotificationFilter } from "@/lib/client-portal/client-notifications";
import { PortalSidebar } from "@/components/client-portal/shell/portal-sidebar";
import { PortalHeader } from "@/components/client-portal/shell/portal-header";
import { PortalMobileNav } from "@/components/client-portal/shell/portal-mobile-nav";
import { PreviewBanner } from "@/components/client-portal/shell/preview-banner";

export const dynamic = "force-dynamic";

/**
 * Shell of the authenticated client portal. The proxy already confines
 * CLIENT sessions and preview cookies to /client; `requireClientSession`
 * is the server-side check that resolves exactly one client for the request.
 */
export default async function ClientPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireClientSession();

  await dbConnect();
  const [unreadNotifications, unreadUpdates] = await Promise.all([
    Notification.countDocuments({ ...clientNotificationFilter(ctx), isRead: false }),
    ClientUpdate.countDocuments({
      clientId: new mongoose.Types.ObjectId(ctx.clientId),
      isPublished: true,
      isDeleted: { $ne: true },
      readByUserIds: { $ne: ctx.userId },
    }),
  ]);

  const support = {
    email: process.env.CLIENT_PORTAL_SUPPORT_EMAIL || undefined,
    phone: process.env.CLIENT_PORTAL_SUPPORT_PHONE || undefined,
    name: process.env.CLIENT_PORTAL_SUPPORT_NAME || undefined,
  };
  const clientName = ctx.businessName || ctx.clientName;

  return (
    <div className="min-h-dvh bg-[hsl(var(--muted)/0.45)] text-foreground">
      {ctx.isPreview && ctx.previewActor ? (
        <PreviewBanner clientName={clientName} actorName={ctx.previewActor.name} />
      ) : null}
      <div className="flex min-h-dvh">
        <PortalSidebar clientName={clientName} unreadUpdates={unreadUpdates} support={support} />
        <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
          <PortalHeader
            clientName={clientName}
            account={{ name: ctx.name, email: ctx.email }}
            unreadNotifications={unreadNotifications}
            unreadUpdates={unreadUpdates}
            isPreview={ctx.isPreview}
            support={support}
          />
          <main
            id="main-content"
            className="mx-auto w-full max-w-[1440px] flex-1 px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-10"
          >
            {children}
          </main>
        </div>
      </div>
      <PortalMobileNav unreadUpdates={unreadUpdates} />
    </div>
  );
}
