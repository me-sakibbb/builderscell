import { ClipboardList, Inbox, LayoutDashboard, Megaphone, UserRound, type LucideIcon } from "lucide-react";

/** One source of truth for the rail, shared by the fixed sidebar and the mobile drawer. */
export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Only light up on an exact match, so a child route does not also mark the parent active. */
  exact?: boolean;
};

export type NavGroup = {
  /** Heading above the group; a hairline stands in for it while the rail is collapsed. */
  heading: string;
  items: NavItem[];
  adminOnly?: boolean;
};

export const NAV_GROUPS: NavGroup[] = [
  {
    heading: "Workspace",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/campaigns", label: "Campaigns", icon: Megaphone },
      { href: "/dashboard/registrations", label: "Registrations", icon: ClipboardList },
      { href: "/profile", label: "Profile", icon: UserRound },
    ],
  },
  {
    heading: "Admin",
    adminOnly: true,
    items: [{ href: "/admin/registrations", label: "Registrations", icon: Inbox }],
  },
];

export const visibleGroups = (isAdmin: boolean) => NAV_GROUPS.filter((g) => !g.adminOnly || isAdmin);

export function isActive(pathname: string, item: NavItem) {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/** Collapse state rides on a cookie so the server renders the rail at the width the
 *  member left it at, and the first paint needs no correction. */
export const RAIL_COOKIE = "bc_rail";
export const RAIL_WIDTH = { expanded: "16rem", collapsed: "4.5rem" } as const;
