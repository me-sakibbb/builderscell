import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

/** Server-rendered pager. Pages are links, so a page load lands on the right slice. */
export function Pagination({
  page,
  pageCount,
  hrefFor,
  label = "Pagination",
  className,
}: {
  page: number;
  pageCount: number;
  hrefFor: (page: number) => string;
  label?: string;
  className?: string;
}) {
  if (pageCount <= 1) return null;

  const step = "inline-flex h-10 items-center gap-1.5 rounded-full border border-line px-4 text-sm text-fg transition-colors hover:border-line-strong hover:bg-surface";
  const disabled = "pointer-events-none opacity-40";

  return (
    <nav aria-label={label} className={cn("flex items-center justify-between gap-4", className)}>
      <Link href={hrefFor(page - 1)} aria-disabled={page <= 1} className={cn(step, page <= 1 && disabled)}>
        <ChevronLeft aria-hidden className="size-4" />
        Previous
      </Link>

      <p aria-live="polite" className="label text-muted">
        Page {page} of {pageCount}
      </p>

      <Link
        href={hrefFor(page + 1)}
        aria-disabled={page >= pageCount}
        className={cn(step, page >= pageCount && disabled)}
      >
        Next
        <ChevronRight aria-hidden className="size-4" />
      </Link>
    </nav>
  );
}
