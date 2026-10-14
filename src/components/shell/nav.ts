import {
  ArrowLeft,
  ClipboardList,
  Gauge,
  Inbox,
  LayoutDashboard,
  Megaphone,
  ShieldCheck,
  TicketPercent,
  UserRound,
  type LucideIcon,
} from "lucide-react";

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

/** Which area the frame is dressing. Passed as a name, since icons cannot cross from a
 *  server layout into the client frame. */
export type ShellVariant = "member" | "admin";

const MEMBER_GROUPS: NavGroup[] = [
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
    items: [{ href: "/admin", label: "Admin panel", icon: ShieldCheck }],
  },
];

const ADMIN_GROUPS: NavGroup[] = [
  {
    heading: "Admin",
    items: [
      { href: "/admin", label: "Overview", icon: Gauge, exact: true },
      { href: "/admin/registrations", label: "Registrations", icon: Inbox },
      { href: "/admin/coupons", label: "Coupons", icon: TicketPercent },
    ],
  },
  {
    heading: "Member area",
    items: [{ href: "/dashboard", label: "Back to dashboard", icon: ArrowLeft, exact: true }],
  },
];

const GROUPS: Record<ShellVariant, NavGroup[]> = { member: MEMBER_GROUPS, admin: ADMIN_GROUPS };

export const visibleGroups = (variant: ShellVariant, isAdmin: boolean) =>
  GROUPS[variant].filter((g) => !g.adminOnly || isAdmin);

export function isActive(pathname: string, item: NavItem) {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/** Collapse state rides on a cookie so the server renders the rail at the width the
 *  member left it at, and the first paint needs no correction. */
export const RAIL_COOKIE = "bc_rail";
export const RAIL_WIDTH = { expanded: "16rem", collapsed: "4.5rem" } as const;
