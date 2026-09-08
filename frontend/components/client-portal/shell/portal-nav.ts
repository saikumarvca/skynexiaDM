import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  Megaphone,
  Star,
  UserRound,
} from "lucide-react";

export type PortalNavItem = {
  key: string;
  name: string;
  shortName: string;
  href: string;
  icon: LucideIcon;
};

/** Sidebar of the client portal, in display order. */
export const PORTAL_NAV: PortalNavItem[] = [
  { key: "dashboard", name: "Dashboard", shortName: "Home", href: "/client/dashboard", icon: LayoutDashboard },
  { key: "reviews", name: "Reviews", shortName: "Reviews", href: "/client/reviews", icon: Star },
  { key: "analytics", name: "Review Analytics", shortName: "Analytics", href: "/client/review-analytics", icon: BarChart3 },
  { key: "change-log", name: "Change Log", shortName: "Changes", href: "/client/change-log", icon: ClipboardList },
  { key: "updates", name: "Updates & Announcements", shortName: "Updates", href: "/client/updates", icon: Megaphone },
  { key: "profile", name: "My Profile", shortName: "Profile", href: "/client/profile", icon: UserRound },
];

/** Bottom navigation on small screens. */
export const PORTAL_MOBILE_NAV = PORTAL_NAV.slice(0, 5);

export function isPortalPathActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
