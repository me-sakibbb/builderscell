"use client";

import { useId } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, LogOut } from "lucide-react";
import { motion } from "motion/react";
import { signOut } from "@/app/auth/actions";
import { isActive, visibleGroups, type NavItem, type ShellVariant } from "@/components/shell/nav";
import { useReducedMotion } from "@/hooks/use-media";
import { cn } from "@/lib/cn";

export type Member = { name: string; email: string; initials: string };

type Shared = {
  collapsed: boolean;
  /** Closes the mobile drawer. Absent for the desktop rail, which has nothing to close. */
  onNavigate?: () => void;
};

/** Every row shares one shape, so the collapsed rail is the same row with its label dropped. */
const rowBase = "group relative flex h-10 items-center rounded-lg transition-colors";
const rowPad = (collapsed: boolean) => (collapsed ? "justify-center" : "gap-3 px-3");

/** Stands in for the label once the rail is collapsed. The rail drops its scroll container
 *  in that state, so there is nothing to clip this. */
function Tip({ children }: { children: React.ReactNode }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute left-full z-50 ml-2.5 origin-left scale-95 rounded-md bg-fg px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-bg opacity-0 shadow-[0_8px_24px_-8px_rgb(0_0_0/0.3)] transition duration-150 ease-out-expo group-hover:scale-100 group-hover:opacity-100"
    >
      {children}
    </span>
  );
}

function Row({ item, collapsed, pillId, onNavigate }: Shared & { item: NavItem; pillId: string }) {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const active = isActive(pathname, item);
  const Icon = item.icon;

  return (
    <li>
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={cn(rowBase, rowPad(collapsed), active ? "text-fg" : "text-muted hover:bg-surface hover:text-fg")}
      >
        {active && (
          <motion.span
            layoutId={pillId}
            aria-hidden
            className="absolute inset-0 rounded-lg bg-surface-2"
            transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34, mass: 0.7 }}
          />
        )}
        <Icon aria-hidden className={cn("relative size-[18px] shrink-0", active && "text-accent-ink")} />
        {collapsed ? (
          <Tip>{item.label}</Tip>
        ) : (
          <span className={cn("relative truncate text-sm", active ? "font-semibold" : "font-medium")}>
            {item.label}
          </span>
        )}
      </Link>
    </li>
  );
}

function Account({ member, collapsed, onNavigate }: Shared & { member: Member | null }) {
  if (!member) {
    return (
      <Link
        href="/login"
        onClick={onNavigate}
        aria-label="Sign in"
        className={cn(
          rowBase,
          rowPad(collapsed),
          "hairline text-fg hover:border-line-strong hover:bg-surface",
          collapsed && "w-10",
        )}
      >
        <LogIn aria-hidden className="size-[18px] shrink-0" />
        {collapsed ? <Tip>Sign in</Tip> : <span className="text-sm font-medium">Sign in</span>}
      </Link>
    );
  }

  return (
    <div className={cn("flex items-center", collapsed ? "flex-col gap-1" : "gap-1")}>
      <Link
        href="/profile"
        onClick={onNavigate}
        title={member.email}
        className={cn(
          "group relative flex min-w-0 items-center rounded-lg transition-colors hover:bg-surface",
          collapsed ? "size-10 justify-center" : "flex-1 gap-2.5 p-1.5",
        )}
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent font-mono text-[11px] font-semibold text-accent-fg">
          {member.initials}
        </span>
        {collapsed ? (
          <Tip>{member.name}</Tip>
        ) : (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-fg">{member.name}</span>
            <span className="block truncate text-xs text-muted">{member.email}</span>
          </span>
        )}
      </Link>

      <form action={signOut} className="contents">
        <button
          type="submit"
          aria-label="Sign out"
          title="Sign out"
          className="grid size-10 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-signal"
        >
          <LogOut aria-hidden className="size-[18px]" />
        </button>
      </form>
    </div>
  );
}

type Props = Shared & {
  member: Member | null;
  isAdmin: boolean;
  variant: ShellVariant;
};

/** The rail's contents, rendered twice: fixed beside the page, and inside the mobile
 *  drawer. The moving pill is scoped by `useId`, so the two copies never fight over it. */
export function Sidebar({ member, isAdmin, variant, collapsed, onNavigate }: Props) {
  const pillId = useId();
  const groups = visibleGroups(variant, isAdmin);

  return (
    <div className="flex h-full flex-col">
      <nav
        aria-label="Sections"
        className={cn("min-h-0 flex-1 px-3 py-4", collapsed ? "overflow-visible" : "overflow-y-auto")}
      >
        {groups.map((group, gi) => {
          const headingId = `${pillId}-${gi}`;
          return (
            <div key={group.heading} className={gi > 0 ? "mt-6" : undefined}>
              {gi > 0 && collapsed && <span aria-hidden className="mx-2 mb-4 block h-px bg-line" />}
              <h2 id={headingId} className={cn("label-xs text-muted", collapsed ? "sr-only" : "mb-2 px-3")}>
                {group.heading}
              </h2>
              <ul aria-labelledby={headingId} className="space-y-0.5">
                {group.items.map((item) => (
                  <Row
                    key={item.href}
                    item={item}
                    collapsed={collapsed}
                    pillId={pillId}
                    onNavigate={onNavigate}
                  />
                ))}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-line p-3">
        <Account member={member} collapsed={collapsed} onNavigate={onNavigate} />
      </div>
    </div>
  );
}
