import { Skeleton } from "@/components/ui/skeleton";

export default function AdminOverviewLoading() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading the overview</span>
      <Skeleton className="h-10 w-48" />
      <Skeleton className="mt-3 h-5 w-64" />

      <div className="mt-8 flex flex-wrap gap-3">
        {[0, 1, 2, 3].map((tile) => (
          <Skeleton key={tile} className="h-[68px] w-28 rounded-xl" />
        ))}
      </div>

      {[0, 1].map((section) => (
        <div key={section} className="mt-14">
          <div className="border-b border-line pb-4">
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="mt-6 space-y-4 border-y border-line py-5">
            {[0, 1, 2, 3].map((row) => (
              <div key={row} className="space-y-2">
                <Skeleton className="h-5 w-2/5" />
                <Skeleton className="h-4 w-3/5" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
