"use client";

import Link from "next/link";
import { initialsOf, useUser } from "@/hooks/use-user";
import { cn } from "@/lib/cn";

/** Nav entry point: "Sign in" while signed out, initials linking to the profile once in. */
export function AccountButton({ className }: { className?: string }) {
  const { user, loaded } = useUser();

  if (!loaded) return <span aria-hidden className={cn("size-10 shrink-0", className)} />;

  if (!user) {
    return (
      <Link
        href="/login"
        className={cn(
          "inline-flex h-10 items-center rounded-full hairline px-4 text-sm font-medium text-fg transition-colors hover:border-line-strong hover:bg-surface",
          className,
        )}
      >
        Sign in
      </Link>
    );
  }

  return (
    <Link
      href="/dashboard"
      aria-label="Your dashboard"
      title={user.email ?? "Your dashboard"}
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-fg transition-transform hover:scale-105",
        className,
      )}
    >
      {initialsOf(user)}
    </Link>
  );
}
