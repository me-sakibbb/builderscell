import { Skeleton } from "@/components/ui/skeleton";

export default function CampaignLoading() {
  return (
    <div role="status" aria-live="polite" className="mx-auto max-w-3xl">
      <span className="sr-only">Loading this campaign</span>
      <Skeleton className="h-7 w-40 rounded-md" />
      <Skeleton className="mt-6 h-16 w-4/5" />
      <Skeleton className="mt-6 h-6 w-full" />
      <Skeleton className="mt-2 h-6 w-2/3" />

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((box) => (
          <Skeleton key={box} className="h-24 rounded-2xl" />
        ))}
      </div>

      <Skeleton className="mt-12 h-4 w-40" />
      <div className="mt-4 space-y-4">
        {[0, 1].map((row) => (
          <Skeleton key={row} className="h-16 w-full rounded-2xl" />
        ))}
      </div>

      <Skeleton className="mt-12 h-13 w-48 rounded-full" />
    </div>
  );
}
