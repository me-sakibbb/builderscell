import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading your dashboard</span>

      <Skeleton className="h-12 w-3/5 max-w-md" />

      <div className="mt-14">
        <div className="flex items-baseline justify-between gap-4 border-b border-line pb-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-12" />
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((card) => (
            <Skeleton key={card} className="h-64 rounded-3xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
