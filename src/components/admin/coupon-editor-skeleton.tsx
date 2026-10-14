import { Skeleton } from "@/components/ui/skeleton";

/** Placeholder for the new and edit coupon pages, which share one layout. */
export function CouponEditorSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-live="polite" className="mx-auto w-full max-w-3xl">
      <span className="sr-only">{label}</span>
      <Skeleton className="h-5 w-32" />
      <Skeleton className="mt-6 h-11 w-2/5" />
      <Skeleton className="mt-3 h-5 w-3/5" />

      <div className="mt-8 space-y-6">
        {[0, 1, 2, 3].map((block) => (
          <Skeleton key={block} className="h-48 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
