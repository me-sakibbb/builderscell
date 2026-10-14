"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn } from "@/app/auth/actions";
import { PasswordInput } from "@/components/auth/password-input";
import { SubmitButton } from "@/components/auth/submit-button";
import { Field, FormError, inputClass } from "@/components/ui/field";
import { EMPTY_AUTH_STATE } from "@/hooks/use-code-flow";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signIn, EMPTY_AUTH_STATE);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <Field label="Email address" htmlFor="email">
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.email}
          placeholder="you@example.com"
          className={inputClass}
        />
      </Field>
      <div className="space-y-2">
        <Field label="Password" htmlFor="password">
          <PasswordInput id="password" autoComplete="current-password" />
        </Field>
        <div className="flex justify-end">
          <Link
            href={`/forgot-password?next=${encodeURIComponent(next)}`}
            className="text-sm text-muted underline-offset-4 transition-colors hover:text-fg hover:underline"
          >
            Forgot password?
          </Link>
        </div>
      </div>
      <FormError>{state.error}</FormError>
      <SubmitButton pending={pending} pendingLabel="Signing in…">
        Sign in
      </SubmitButton>
    </form>
  );
}
