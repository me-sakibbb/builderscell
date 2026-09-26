"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

/** Big selectable card: registering type, payment method, team size. */
export function ChoiceCard({
  selected,
  onSelect,
  title,
  body,
  aside,
  disabled,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  body?: string;
  aside?: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "group flex w-full items-start gap-4 rounded-2xl border p-5 text-left transition-colors",
        selected ? "border-accent bg-accent/5" : "border-line bg-surface/60 hover:border-line-strong",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border transition-colors",
          selected ? "border-accent bg-accent text-accent-fg" : "border-line-strong",
        )}
      >
        {selected && <Check className="size-3" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-medium text-fg">{title}</span>
        {body && <span className="mt-1 block text-sm text-muted">{body}</span>}
      </span>
      {aside && <span className="shrink-0 font-mono text-sm text-fg">{aside}</span>}
    </button>
  );
}

/** The form's Yes/No answers. Both sides are shown; only Yes lets a registration through. */
export function YesNo({
  value,
  onChange,
  label,
  error,
  id,
}: {
  value: boolean | null;
  onChange: (value: boolean) => void;
  label: string;
  error?: string;
  id: string;
}) {
  return (
    <div className="rounded-2xl hairline bg-surface/60 p-4">
      <p id={`${id}-label`} className="text-sm leading-relaxed text-fg">
        {label}
      </p>
      <div role="radiogroup" aria-labelledby={`${id}-label`} className="mt-3 flex gap-2">
        {[
          { v: true, text: "Yes" },
          { v: false, text: "No" },
        ].map((option) => (
          <button
            key={option.text}
            type="button"
            role="radio"
            aria-checked={value === option.v}
            onClick={() => onChange(option.v)}
            className={cn(
              "h-10 min-w-20 rounded-full border px-5 text-sm font-medium transition-colors",
              value === option.v
                ? option.v
                  ? "border-accent bg-accent text-accent-fg"
                  : "border-signal bg-signal/10 text-signal"
                : "border-line text-muted hover:border-line-strong hover:text-fg",
            )}
          >
            {option.text}
          </button>
        ))}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-signal">
          {error}
        </p>
      )}
    </div>
  );
}
