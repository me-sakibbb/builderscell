import { cn } from "@/lib/cn";

/** On/off switch. A plain button, so it works as a form submit as well as an onClick toggle. */
export function Switch({
  checked,
  className,
  ...props
}: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "role" | "aria-checked"> & { checked: boolean }) {
  return (
    <button
      type="button"
      {...props}
      role="switch"
      aria-checked={checked}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors disabled:opacity-60",
        checked ? "border-accent bg-accent" : "border-line-strong bg-surface-2",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "inline-block size-4 rounded-full transition-transform duration-200 ease-out-expo",
          checked ? "translate-x-6 bg-accent-fg" : "translate-x-1 bg-muted",
        )}
      />
    </button>
  );
}
