"use client";

import { ChevronDown } from "lucide-react";
import { inputClass } from "@/components/ui/field";
import { cn } from "@/lib/cn";

/** Native select in the same shell as the text inputs, so forms line up. */
export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select {...props} className={cn(inputClass, "appearance-none pr-10", className)}>
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-muted"
      />
    </div>
  );
}
