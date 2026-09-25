import { cn } from "@/lib/cn";

/** Shared input shell so every auth field matches the site's hairline surfaces. */
export const inputClass =
  "h-12 w-full rounded-xl hairline bg-surface px-4 text-base text-fg transition-colors placeholder:text-muted/70 hover:border-line-strong disabled:opacity-60";

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-fg">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-sm text-signal">
          {error}
        </p>
      ) : hint ? (
        <p className="text-sm text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function FormError({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="rounded-xl border border-signal/30 bg-signal/10 px-4 py-3 text-sm text-signal">
      {children}
    </p>
  );
}
