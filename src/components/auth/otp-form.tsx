"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { sendOtp, verifyOtp, type AuthState } from "@/app/auth/actions";
import { Field, FormError, inputClass } from "@/components/ui/field";
import { cn } from "@/lib/cn";

const EMPTY: AuthState = {};
const RESEND_SECONDS = 45;
const BOXES = 6;

export function OtpForm({ intent, next }: { intent: "login" | "signup"; next: string }) {
  const [sendState, sendAction, sending] = useActionState(sendOtp, EMPTY);
  const [verifyState, verifyAction, verifying] = useActionState(verifyOtp, EMPTY);

  // `override` lets "use a different email" walk back a step without resetting the action state.
  const [override, setOverride] = useState<"email" | null>(null);
  const [sentAt, setSentAt] = useState(0);
  const [now, setNow] = useState(0);
  const [digits, setDigits] = useState<string[]>(() => Array(BOXES).fill(""));

  const boxes = useRef<(HTMLInputElement | null)[]>([]);
  const codeForm = useRef<HTMLFormElement>(null);

  const step = override ?? (sendState.sent ? "code" : "email");
  const email = sendState.email ?? "";
  const waitLeft = sentAt ? Math.max(0, RESEND_SECONDS - Math.floor((now - sentAt) / 1000)) : 0;

  useEffect(() => {
    if (!sentAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [sentAt]);

  const onSend = () => {
    setOverride(null);
    setSentAt(Date.now());
    setNow(Date.now());
    setDigits(Array(BOXES).fill(""));
  };

  const write = (index: number, value: string) => {
    const chars = value.replace(/\D/g, "").split("");
    if (!chars.length) return;

    const filled = [...digits];
    for (let i = 0; i < chars.length && index + i < BOXES; i++) filled[index + i] = chars[i];
    setDigits(filled);

    const nextEmpty = filled.findIndex((d, i) => i >= index && !d);
    boxes.current[nextEmpty === -1 ? BOXES - 1 : nextEmpty]?.focus();

    if (filled.every(Boolean)) codeForm.current?.requestSubmit();
  };

  if (step === "email") {
    return (
      <form action={sendAction} onSubmit={onSend} className="space-y-4">
        <input type="hidden" name="intent" value={intent} />
        <Field label="Email address" htmlFor="email">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue={email}
            placeholder="you@example.com"
            className={inputClass}
          />
        </Field>
        <FormError>{sendState.error}</FormError>
        <button
          type="submit"
          disabled={sending}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-fg text-sm font-medium text-bg transition-colors hover:bg-accent hover:text-accent-fg disabled:opacity-60"
        >
          {sending && <Loader2 aria-hidden className="size-4 animate-spin" />}
          {sending ? "Sending code…" : "Email me a code"}
        </button>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      <form ref={codeForm} action={verifyAction} className="space-y-4">
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="next" value={next} />
        <input type="hidden" name="token" value={digits.join("")} />

        <div className="space-y-2">
          <p className="text-sm text-muted">
            We sent a 6-digit code to <span className="font-medium text-fg">{email}</span>. It expires in 10 minutes.
          </p>
          <div className="flex justify-between gap-2" role="group" aria-label="Verification code">
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  boxes.current[i] = el;
                }}
                value={digit}
                onChange={(e) => write(i, e.target.value)}
                onPaste={(e) => {
                  e.preventDefault();
                  write(0, e.clipboardData.getData("text"));
                }}
                onKeyDown={(e) => {
                  if (e.key !== "Backspace") return;
                  e.preventDefault();
                  const filled = [...digits];
                  if (filled[i]) filled[i] = "";
                  else if (i > 0) {
                    filled[i - 1] = "";
                    boxes.current[i - 1]?.focus();
                  }
                  setDigits(filled);
                }}
                inputMode="numeric"
                autoComplete={i === 0 ? "one-time-code" : "off"}
                aria-label={`Digit ${i + 1}`}
                maxLength={1}
                disabled={verifying}
                autoFocus={i === 0}
                className={cn(
                  inputClass,
                  "h-14 w-full px-0 text-center font-mono text-xl tracking-widest tabular-nums",
                )}
              />
            ))}
          </div>
        </div>

        <FormError>{verifyState.error}</FormError>

        <button
          type="submit"
          disabled={verifying || digits.some((d) => !d)}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-fg text-sm font-medium text-bg transition-colors hover:bg-accent hover:text-accent-fg disabled:opacity-60"
        >
          {verifying && <Loader2 aria-hidden className="size-4 animate-spin" />}
          {verifying ? "Checking…" : "Verify and continue"}
        </button>
      </form>

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={() => setOverride("email")}
          className="inline-flex items-center gap-1.5 text-muted transition-colors hover:text-fg"
        >
          <ArrowLeft aria-hidden className="size-4" />
          Different email
        </button>

        <form action={sendAction} onSubmit={onSend}>
          <input type="hidden" name="intent" value={intent} />
          <input type="hidden" name="email" value={email} />
          <button
            type="submit"
            disabled={sending || waitLeft > 0}
            className="text-muted transition-colors hover:text-fg disabled:hover:text-muted"
          >
            {waitLeft > 0 ? `Resend in ${waitLeft}s` : sending ? "Sending…" : "Resend code"}
          </button>
        </form>
      </div>
    </div>
  );
}
