import { redirect } from "next/navigation";
import { getCachedUser } from "@/lib/auth";
import { getPortalClient } from "@/lib/client-portal";
import { ClientPortalHeader } from "@/components/client-portal/client-portal-header";

export const dynamic = "force-dynamic";

/**
 * Shell for external client logins (role CLIENT). The proxy already keeps
 * such sessions inside /client-portal; this layout is the server-side check
 * that only CLIENT accounts render it, and it never shows the agency sidebar.
 */
export default async function ClientPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user: Awaited<ReturnType<typeof getCachedUser>>;
  try {
    user = await getCachedUser();
  } catch {
    redirect("/login?next=%2Fclient-portal");
  }
  if (user.role !== "CLIENT") redirect("/dashboard");

  const client = await getPortalClient(user.clientId);

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <ClientPortalHeader
        user={{ name: user.name, email: user.email }}
        clientName={client?.businessName || client?.name || "Client portal"}
      />
      <main
        id="main-content"
        className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6"
      >
        {children}
      </main>
      <footer className="border-t py-4 text-center text-xs text-muted-foreground">
        Figures update as your agency team shares and posts reviews.
      </footer>
    </div>
  );
}
