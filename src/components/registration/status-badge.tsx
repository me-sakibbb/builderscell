import { REGISTRATION_STATUS_LABEL } from "@/lib/validation/registration";
import { cn } from "@/lib/cn";

const TONE: Record<string, string> = {
  draft: "border-line text-muted",
  pending: "border-line-strong text-fg",
  approved: "border-accent bg-accent/10 text-accent-ink",
  rejected: "border-signal/40 bg-signal/10 text-signal",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-full border px-3 label-xs",
        TONE[status] ?? TONE.draft,
        className,
      )}
    >
      {REGISTRATION_STATUS_LABEL[status] ?? status}
    </span>
  );
}
