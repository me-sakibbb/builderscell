import { cn } from "@/lib/cn";

/** Builders' Cell wordmark. The apostrophe is a red dot, a nod to the flag. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-baseline font-sans tracking-[-0.03em] select-none", className)}>
      <span className="font-normal">Builders</span>
      <span
        aria-hidden
        className="relative mx-[0.02em] inline-block size-[0.22em] -translate-y-[0.62em] rounded-full bg-signal"
      />
      <span className="font-bold">Cell</span>
      <span className="sr-only">Builders&apos; Cell</span>
    </span>
  );
}
