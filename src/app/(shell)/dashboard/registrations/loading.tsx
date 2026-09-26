import { Skeleton } from "@/components/ui/skeleton";

export default function RegistrationsLoading() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading your registrations</span>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Skeleton className="h-7 w-32 rounded-md" />
          <Skeleton className="mt-6 h-12 w-72 max-w-full" />
        </div>
        <Skeleton className="h-11 w-40 rounded-full" />
      </div>

      <div className="mt-12 divide-y divide-line border-y border-line">
        {[0, 1, 2, 3, 4].map((row) => (
          <div key={row} className="flex items-center justify-between gap-6 py-4">
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-5 w-2/5" />
              <Skeleton className="h-3 w-3/5" />
            </div>
            <Skeleton className="size-5 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
