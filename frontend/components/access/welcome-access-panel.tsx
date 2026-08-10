import {
  buildDashboardNavItems,
  type DashboardNavItem,
} from "@/lib/dashboard-navigation";
import {
  WelcomeAccessClient,
  type AccessCardItem,
} from "@/components/access/welcome-access-client";

function flattenAccessCards(navItems: DashboardNavItem[]): AccessCardItem[] {
  const map = new Map<string, AccessCardItem>();
  for (const item of navItems) {
    if ("children" in item && item.children) {
      for (const child of item.children) {
        const key = `${item.name}:${child.href}`;
        map.set(key, {
          name: child.name,
          href: child.href,
          section: item.name,
        });
      }
      continue;
    }

    const key = `${item.name}:${item.href}`;
    map.set(key, {
      name: item.name,
      href: item.href,
      section: "General",
    });
  }
  return Array.from(map.values());
}

export function WelcomeAccessPanel({
  userName,
  isAdmin,
  permissions,
}: {
  userName: string;
  isAdmin: boolean;
  permissions: string[];
}) {
  const navItems = buildDashboardNavItems(isAdmin, permissions);
  const accessCards = flattenAccessCards(navItems);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome</h1>
        <p className="mt-1 text-muted-foreground">
          Hi {userName}, here are the modules you can currently access.
        </p>
      </div>

      <WelcomeAccessClient items={accessCards} />

      <p className="text-xs text-muted-foreground">
        Need more access? Please contact an admin to update your role
        permissions.
      </p>
    </div>
  );
}
