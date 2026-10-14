"use client";

import { ArrowLeft } from "lucide-react";
import { SubmitButton } from "@/components/auth/submit-button";
import { FormError, inputClass } from "@/components/ui/field";
import { useCodeInput } from "@/hooks/use-code-input";
import { useResendTimer } from "@/hooks/use-resend-timer";
import { cn } from "@/lib/cn";

const CODE_LENGTH = 6;
const RESEND_SECONDS = 45;

type FormAction = (formData: FormData) => void;

/**
 * Second step of every emailed-code flow: the code boxes, any extra fields the flow needs
 * (passed as children), a way back to the email step, and a rate-limited resend.
 */
export function CodeStep({
  email,
  lead,
  action,
  pending,
  error,
  hidden,
  autoSubmit = false,
  submitLabel,
  pendingLabel,
  resend,
  onBack,
  children,
}: {
  email: string;
  lead?: React.ReactNode;
  action: FormAction;
  pending: boolean;
  error?: string;
  hidden: Record<string, string>;
  autoSubmit?: boolean;
  submitLabel: string;
  pendingLabel: string;
  resend: { action: FormAction; pending: boolean; error?: string };
  onBack: () => void;
  children?: React.ReactNode;
}) {
  const code = useCodeInput(CODE_LENGTH, autoSubmit);
  const timer = useResendTimer(RESEND_SECONDS);

  return (
    <div className="space-y-4">
      <form action={action} className="space-y-4">
        {Object.entries(hidden).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <input type="hidden" name="token" value={code.value} />

        <div className="space-y-2">
          <p className="text-sm text-muted">
            {lead ?? (
              <>
                We sent a 6-digit code to <span className="font-medium text-fg">{email}</span>. It expires in 10
                minutes.
              </>
            )}
          </p>
          <div className="flex justify-between gap-2" role="group" aria-label="Verification code">
            {code.digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  code.boxes.current[i] = el;
                }}
                value={digit}
                onChange={(e) => code.write(i, e.target.value)}
                onPaste={(e) => {
                  e.preventDefault();
                  code.write(0, e.clipboardData.getData("text"));
                }}
                onKeyDown={(e) => {
                  if (e.key !== "Backspace") return;
                  e.preventDefault();
                  code.erase(i);
                }}
                inputMode="numeric"
                autoComplete={i === 0 ? "one-time-code" : "off"}
                aria-label={`Digit ${i + 1}`}
                maxLength={1}
                disabled={pending}
                autoFocus={i === 0}
                className={cn(inputClass, "h-14 w-full px-0 text-center font-mono text-xl tracking-widest tabular-nums")}
              />
            ))}
          </div>
        </div>

        {children}

        <FormError>{error}</FormError>
        <FormError>{resend.error}</FormError>

        <SubmitButton pending={pending} pendingLabel={pendingLabel} disabled={!code.complete}>
          {submitLabel}
        </SubmitButton>
      </form>

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-muted transition-colors hover:text-fg"
        >
          <ArrowLeft aria-hidden className="size-4" />
          Different email
        </button>

        <form
          action={resend.action}
          onSubmit={() => {
            timer.restart();
            code.clear();
          }}
        >
          <input type="hidden" name="email" value={email} />
          <button
            type="submit"
            disabled={resend.pending || timer.left > 0}
            className="text-muted transition-colors hover:text-fg disabled:hover:text-muted"
          >
            {timer.left > 0 ? `Resend in ${timer.left}s` : resend.pending ? "Sending…" : "Resend code"}
          </button>
        </form>
      </div>
    </div>
  );
}
