import { Skeleton } from "@/components/ui/skeleton";

export default function RegisterLoading() {
  return (
    <div role="status" aria-live="polite" className="mx-auto max-w-3xl">
      <span className="sr-only">Loading the registration form</span>
      <Skeleton className="h-5 w-48" />
      <Skeleton className="mt-6 h-11 w-4/5" />
      <Skeleton className="mt-4 h-5 w-3/5" />

      <div className="mt-10 flex flex-wrap gap-2">
        {[0, 1, 2, 3].map((chip) => (
          <Skeleton key={chip} className="h-8 w-24 rounded-full" />
        ))}
      </div>

      <div className="mt-8 space-y-5">
        <Skeleton className="h-8 w-2/5" />
        {[0, 1, 2].map((row) => (
          <Skeleton key={row} className="h-20 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
