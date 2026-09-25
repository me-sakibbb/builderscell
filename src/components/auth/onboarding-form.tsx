"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { completeOnboarding, type OnboardingState } from "@/app/auth/actions";
import { InstitutionSelect } from "@/components/auth/institution-select";
import { Field, FormError, inputClass } from "@/components/ui/field";
import { cn } from "@/lib/cn";

const EMPTY: OnboardingState = {};

export function OnboardingForm({
  defaultName,
  email,
  next,
}: {
  defaultName: string;
  email: string;
  next: string;
}) {
  const [state, action, pending] = useActionState(completeOnboarding, EMPTY);
  const errors = state.fieldErrors ?? {};
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next} />

      <Field label="Full name" htmlFor="fullName" error={errors.fullName}>
        <input
          id="fullName"
          name="fullName"
          type="text"
          required
          autoComplete="name"
          maxLength={80}
          defaultValue={defaultName}
          placeholder="As it should appear on your certificate"
          aria-invalid={Boolean(errors.fullName)}
          className={inputClass}
        />
      </Field>

      <Field label="Educational institution" htmlFor="institution" error={errors.institutionId}>
        <InstitutionSelect error={errors.institutionId} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Date of birth" htmlFor="dob" error={errors.dob}>
          <input
            id="dob"
            name="dob"
            type="date"
            required
            max={today}
            min="1900-01-01"
            autoComplete="bday"
            aria-invalid={Boolean(errors.dob)}
            className={cn(inputClass, "font-mono")}
          />
        </Field>

        <Field label="Phone number" htmlFor="phone" error={errors.phone} hint="Bangladeshi mobile number">
          <div className="flex items-stretch">
            <span className="flex items-center rounded-l-xl border border-r-0 border-line bg-bg-elev px-3 font-mono text-sm text-muted">
              +880
            </span>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="1712 345678"
              aria-invalid={Boolean(errors.phone)}
              className={cn(inputClass, "rounded-l-none font-mono")}
            />
          </div>
        </Field>
      </div>

      <p className="text-sm text-muted">
        Signed in as <span className="font-medium text-fg">{email}</span>
      </p>

      <FormError>{state.error}</FormError>

      <button
        type="submit"
        disabled={pending}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-fg text-sm font-medium text-bg transition-colors hover:bg-accent hover:text-accent-fg disabled:opacity-60"
      >
        {pending && <Loader2 aria-hidden className="size-4 animate-spin" />}
        {pending ? "Saving…" : "Finish setting up"}
      </button>
    </form>
  );
}
