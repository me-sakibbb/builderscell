import { cn } from "@/lib/cn";

/** Builder'sCell wordmark. The apostrophe is a red dot, a nod to the flag. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-baseline font-sans tracking-[-0.03em] select-none", className)}>
      <span className="font-normal">Builder</span>
      <span
        aria-hidden
        className="relative mx-[0.02em] inline-block size-[0.22em] -translate-y-[0.62em] rounded-full bg-signal"
      />
      <span className="font-normal">s</span>
      <span className="font-bold">Cell</span>
      <span className="sr-only">Builder&apos;s Cell</span>
    </span>
  );
}
