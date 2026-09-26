import { Skeleton } from "@/components/ui/skeleton";

export default function AdminRegistrationLoading() {
  return (
    <div role="status" aria-live="polite" className="mx-auto w-full max-w-3xl">
      <span className="sr-only">Loading this registration</span>
      <Skeleton className="h-5 w-40" />
      <Skeleton className="mt-6 h-11 w-3/5" />
      <Skeleton className="mt-3 h-5 w-2/5" />

      <div className="mt-8 space-y-6">
        {[0, 1, 2].map((block) => (
          <Skeleton key={block} className="h-44 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
