import { Skeleton } from "@/components/ui/skeleton";

export default function CampaignsLoading() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading campaigns</span>
      <Skeleton className="h-7 w-32 rounded-md" />
      <Skeleton className="mt-6 h-14 w-4/5 max-w-2xl" />
      <Skeleton className="mt-5 h-6 w-3/5 max-w-xl" />

      <div className="mt-14 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((card) => (
          <div key={card} className="rounded-3xl hairline bg-surface/60 p-6">
            <Skeleton className="h-7 w-40 rounded-full" />
            <Skeleton className="mt-5 h-8 w-3/4" />
            <Skeleton className="mt-3 h-5 w-full" />
            <Skeleton className="mt-2 h-5 w-2/3" />
            <div className="mt-6 space-y-2 border-t border-line pt-4">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
