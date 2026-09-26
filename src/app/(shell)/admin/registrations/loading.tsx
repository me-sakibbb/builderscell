import { Skeleton } from "@/components/ui/skeleton";

export default function AdminRegistrationsLoading() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading registrations</span>
      <Skeleton className="h-10 w-64" />
      <Skeleton className="mt-3 h-5 w-48" />

      <div className="mt-8 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
        {[0, 1, 2, 3].map((field) => (
          <Skeleton key={field} className="h-12 w-full rounded-xl sm:w-44" />
        ))}
      </div>

      <div className="mt-8 space-y-4 border-y border-line py-5">
        {[0, 1, 2, 3, 4].map((row) => (
          <div key={row} className="space-y-2">
            <Skeleton className="h-5 w-2/5" />
            <Skeleton className="h-4 w-3/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
