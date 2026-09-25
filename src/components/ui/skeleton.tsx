import { cn } from "@/lib/cn";

/** Placeholder block for loading states. Pair with a `role="status"` wrapper. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-lg bg-surface-2", className)} />;
}
