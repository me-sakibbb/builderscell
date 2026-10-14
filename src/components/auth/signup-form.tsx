"use client";

import { useActionState } from "react";
import { resendSignupCode, signUp, verifySignup } from "@/app/auth/actions";
import { CodeStep } from "@/components/auth/code-step";
import { PasswordInput } from "@/components/auth/password-input";
import { SubmitButton } from "@/components/auth/submit-button";
import { Field, FormError, inputClass } from "@/components/ui/field";
import { EMPTY_AUTH_STATE, useCodeFlow } from "@/hooks/use-code-flow";
import { PASSWORD_MIN } from "@/lib/validation/profile";

export function SignupForm({ next }: { next: string }) {
  const flow = useCodeFlow(signUp);
  const [verifyState, verifyAction, verifying] = useActionState(verifySignup, EMPTY_AUTH_STATE);
  const [resendState, resendAction, resending] = useActionState(resendSignupCode, EMPTY_AUTH_STATE);

  if (flow.onCode) {
    return (
      <CodeStep
        email={flow.email}
        action={verifyAction}
        pending={verifying}
        error={verifyState.error}
        hidden={{ email: flow.email, next }}
        autoSubmit
        submitLabel="Verify and continue"
        pendingLabel="Checking…"
        resend={{ action: resendAction, pending: resending, error: resendState.error }}
        onBack={flow.back}
      />
    );
  }

  return (
    <form action={flow.formAction} className="space-y-4">
      <Field label="Email address" htmlFor="email">
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={flow.email}
          placeholder="you@example.com"
          className={inputClass}
        />
      </Field>
      <Field label="Password" htmlFor="password" hint={`At least ${PASSWORD_MIN} characters.`}>
        <PasswordInput id="password" autoComplete="new-password" minLength={PASSWORD_MIN} />
      </Field>
      <FormError>{flow.state.error}</FormError>
      <SubmitButton pending={flow.pending} pendingLabel="Sending code…">
        Create account
      </SubmitButton>
    </form>
  );
}
