import { Skeleton } from "@/components/ui/skeleton";

export default function AdminCouponsLoading() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading coupons</span>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Skeleton className="h-10 w-48" />
          <Skeleton className="mt-3 h-5 w-80" />
        </div>
        <Skeleton className="h-12 w-36 rounded-xl" />
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-[1fr_auto]">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl sm:w-24" />
      </div>

      <div className="mt-8 space-y-4 border-y border-line py-5">
        {[0, 1, 2, 3, 4].map((row) => (
          <div key={row} className="flex items-center justify-between gap-6">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <Skeleton className="h-6 w-11 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
