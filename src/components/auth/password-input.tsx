"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { inputClass } from "@/components/ui/field";
import { cn } from "@/lib/cn";

export function PasswordInput({
  id,
  autoComplete,
  minLength,
  disabled,
}: {
  id: string;
  autoComplete: "current-password" | "new-password";
  minLength?: number;
  disabled?: boolean;
}) {
  const [shown, setShown] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        name="password"
        type={shown ? "text" : "password"}
        autoComplete={autoComplete}
        required
        minLength={minLength}
        disabled={disabled}
        className={cn(inputClass, "pr-12")}
      />
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        aria-label={shown ? "Hide password" : "Show password"}
        aria-pressed={shown}
        className="absolute inset-y-0 right-0 grid w-12 place-items-center text-muted transition-colors hover:text-fg"
      >
        {shown ? <EyeOff aria-hidden className="size-[18px]" /> : <Eye aria-hidden className="size-[18px]" />}
      </button>
    </div>
  );
}
