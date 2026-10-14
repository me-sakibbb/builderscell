"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, Menu, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { RAIL_WIDTH, type ShellVariant } from "@/components/shell/nav";
import { Sidebar, type Member } from "@/components/shell/sidebar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Wordmark } from "@/components/ui/wordmark";
import { useRail } from "@/hooks/use-rail";
import { cn } from "@/lib/cn";

type Props = {
  member: Member | null;
  isAdmin: boolean;
  /** The member area and the admin panel share this frame; only the rail and a tag differ. */
  variant?: ShellVariant;
  defaultCollapsed: boolean;
  children: React.ReactNode;
};

/** Marks the admin panel beside the wordmark, so it is never mistaken for the member area. */
function Brand({ variant }: { variant: ShellVariant }) {
  return (
    <span className="flex items-center gap-2.5">
      <Link href="/" className="text-xl" aria-label="Builders' Cell home">
        <Wordmark />
      </Link>
      {variant === "admin" && (
        <span className="inline-flex h-6 items-center rounded-full border border-accent bg-accent/10 px-2.5 label-xs text-accent-ink">
          Admin
        </span>
      )}
    </span>
  );
}

/** The topbar keeps the brand and the theme switch; the rail below owns navigation and the
 *  account cluster. Below `lg` the rail folds into a drawer, so the topbar carries a menu
 *  button and a way through to the account for as long as the rail is out of reach. */
export function ShellFrame({ member, isAdmin, variant = "member", defaultCollapsed, children }: Props) {
  const pathname = usePathname();
  const { collapsed, toggle } = useRail(defaultCollapsed);

  // The drawer is tied to the route it was opened on, so any navigation - a link inside
  // it, or the browser's back button - closes it without an effect to keep in sync.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const open = openedOn === pathname;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenedOn(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div
      className="min-h-dvh bg-bg"
      style={{ "--rail-w": collapsed ? RAIL_WIDTH.collapsed : RAIL_WIDTH.expanded } as React.CSSProperties}
    >
      <header className="sticky top-0 z-40 flex h-16 items-center gap-2 border-b border-line bg-bg-elev px-4 sm:px-6">
        {/* Same slot, two jobs: below `lg` it opens the drawer, above it collapses the rail. */}
        <button
          type="button"
          onClick={() => setOpenedOn(pathname)}
          aria-label="Open menu"
          aria-expanded={open}
          className="-ml-1 grid size-9 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-fg lg:hidden"
        >
          <Menu aria-hidden className="size-[18px]" />
        </button>
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          className="-ml-1 hidden size-9 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-fg lg:grid"
        >
          {collapsed ? (
            <PanelLeftOpen aria-hidden className="size-[18px]" />
          ) : (
            <PanelLeftClose aria-hidden className="size-[18px]" />
          )}
        </button>

        <Brand variant={variant} />

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          {member ? (
            <Link
              href="/profile"
              title={member.email}
              aria-label={`Profile: ${member.name}`}
              className="grid size-8 shrink-0 place-items-center rounded-full bg-accent font-mono text-[11px] font-semibold text-accent-fg lg:hidden"
            >
              {member.initials}
            </Link>
          ) : (
            <Link
              href="/login"
              aria-label="Sign in"
              className="grid size-10 place-items-center rounded-full hairline text-muted transition-colors hover:border-line-strong hover:bg-surface hover:text-fg lg:hidden"
            >
              <LogIn aria-hidden className="size-[18px]" />
            </Link>
          )}
        </div>
      </header>

      <aside className="fixed inset-y-0 top-16 left-0 z-30 hidden w-(--rail-w) border-r border-line bg-bg-elev transition-[width] duration-300 ease-out-expo motion-reduce:transition-none lg:block">
        <Sidebar member={member} isAdmin={isAdmin} variant={variant} collapsed={collapsed} />
      </aside>

      <div
        className={cn("fixed inset-0 z-50 lg:hidden", open ? "pointer-events-auto" : "pointer-events-none")}
        aria-hidden={!open}
      >
        <button
          type="button"
          tabIndex={-1}
          aria-label="Close menu"
          onClick={() => setOpenedOn(null)}
          className={cn(
            "absolute inset-0 bg-black/50 transition-opacity duration-300",
            open ? "opacity-100" : "opacity-0",
          )}
        />
        <div
          className={cn(
            "absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-line bg-bg-elev transition-transform duration-300 ease-out-expo",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5">
            <Brand variant={variant} />
            <button
              type="button"
              onClick={() => setOpenedOn(null)}
              aria-label="Close menu"
              className="-mr-2 grid size-9 place-items-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-fg"
            >
              <X aria-hidden className="size-[18px]" />
            </button>
          </div>
          <div className="min-h-0 flex-1">
            <Sidebar
              member={member}
              isAdmin={isAdmin}
              variant={variant}
              collapsed={false}
              onNavigate={() => setOpenedOn(null)}
            />
          </div>
        </div>
      </div>

      <div className="relative transition-[padding] duration-300 ease-out-expo motion-reduce:transition-none lg:pl-(--rail-w)">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 blueprint [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]"
        />
        <main className="relative mx-auto w-full max-w-5xl px-4 pt-10 pb-24 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
