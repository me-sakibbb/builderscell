import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading your profile</span>

      <div className="flex items-center gap-4">
        <Skeleton className="size-14 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-8 w-3/5" />
          <Skeleton className="h-5 w-2/5" />
        </div>
      </div>

      <div className="mt-10 rounded-3xl hairline bg-surface/60 px-5 sm:px-7">
        {[0, 1, 2, 3, 4].map((row) => (
          <div key={row} className="grid gap-2 border-b border-line py-4 last:border-0 sm:grid-cols-[13rem_1fr] sm:gap-6">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-3/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
