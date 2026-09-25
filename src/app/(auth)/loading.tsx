import { Skeleton } from "@/components/ui/skeleton";

export default function AuthLoading() {
  return (
    <div role="status" aria-live="polite" className="rounded-3xl hairline glass p-6 sm:p-8">
      <span className="sr-only">Loading</span>
      <Skeleton className="h-7 w-28 rounded-md" />
      <Skeleton className="mt-5 h-9 w-4/5" />
      <Skeleton className="mt-3 h-5 w-3/5" />
      <Skeleton className="mt-7 h-12 w-full rounded-xl" />
      <Skeleton className="mt-4 h-12 w-full rounded-xl" />
      <Skeleton className="mt-5 h-12 w-full rounded-xl" />
    </div>
  );
}
