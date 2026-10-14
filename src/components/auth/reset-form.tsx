"use client";

import { useActionState } from "react";
import { resetPassword, sendResetCode } from "@/app/auth/actions";
import { CodeStep } from "@/components/auth/code-step";
import { PasswordInput } from "@/components/auth/password-input";
import { SubmitButton } from "@/components/auth/submit-button";
import { Field, FormError, inputClass } from "@/components/ui/field";
import { EMPTY_AUTH_STATE, useCodeFlow } from "@/hooks/use-code-flow";
import { PASSWORD_MIN } from "@/lib/validation/profile";

export function ResetForm({ next }: { next: string }) {
  const flow = useCodeFlow(sendResetCode);
  const [resetState, resetAction, resetting] = useActionState(resetPassword, EMPTY_AUTH_STATE);
  const [resendState, resendAction, resending] = useActionState(sendResetCode, EMPTY_AUTH_STATE);

  if (flow.onCode) {
    return (
      <CodeStep
        email={flow.email}
        lead={
          <>
            If an account uses <span className="font-medium text-fg">{flow.email}</span>, we sent it a 6-digit code.
            It expires in 10 minutes.
          </>
        }
        action={resetAction}
        pending={resetting}
        error={resetState.error}
        hidden={{ email: flow.email, next }}
        submitLabel="Set new password"
        pendingLabel="Saving…"
        resend={{ action: resendAction, pending: resending, error: resendState.error }}
        onBack={flow.back}
      >
        <Field label="New password" htmlFor="password" hint={`At least ${PASSWORD_MIN} characters.`}>
          <PasswordInput id="password" autoComplete="new-password" minLength={PASSWORD_MIN} disabled={resetting} />
        </Field>
      </CodeStep>
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
      <FormError>{flow.state.error}</FormError>
      <SubmitButton pending={flow.pending} pendingLabel="Sending code…">
        Email me a reset code
      </SubmitButton>
    </form>
  );
}
