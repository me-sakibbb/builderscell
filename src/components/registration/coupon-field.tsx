"use client";

import { Check, Loader2, X } from "lucide-react";
import { OfferPrice } from "@/components/campaigns/offer";
import { bdt } from "@/content/site";
import { inputClass } from "@/components/ui/field";
import type { RegistrationWizard } from "@/hooks/use-registration-wizard";
import { cn } from "@/lib/cn";

/** The amount due, with the listed fee struck through while a coupon is on. */
export function AmountDue({ wizard, className }: { wizard: RegistrationWizard; className?: string }) {
  if (wizard.listedFee === null) return null;

  if (wizard.couponChecking) {
    return (
      <span className={cn("inline-flex items-center gap-2 text-muted", className)}>
        <Loader2 aria-hidden className="size-4 animate-spin" />
        Checking coupon
      </span>
    );
  }

  return (
    <OfferPrice listed={wizard.listedFee} offer={wizard.coupon} className={cn("font-medium text-fg", className)} />
  );
}

/** Coupon entry on the payment step. It sits above the payment numbers so the member
 *  knows the amount before sending anything. */
export function CouponField({ wizard }: { wizard: RegistrationWizard }) {
  const { coupon } = wizard;

  if (coupon) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent/40 bg-accent/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <span aria-hidden className="grid size-6 place-items-center rounded-full bg-accent text-accent-fg">
            <Check className="size-3.5" />
          </span>
          <div>
            <p className="text-sm text-fg">
              <span className="font-mono font-medium">{coupon.code}</span> applied
            </p>
            <p className="text-sm text-accent-ink">You save {bdt(coupon.discount)}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={wizard.removeCoupon}
          className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-fg"
        >
          <X aria-hidden className="size-4" />
          Remove
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label htmlFor="couponCode" className="block text-sm font-medium text-fg">
        Have a coupon?
      </label>
      <div className="flex gap-2">
        <input
          id="couponCode"
          type="text"
          maxLength={32}
          autoComplete="off"
          placeholder="Coupon code"
          value={wizard.couponInput}
          onChange={(e) => wizard.changeCouponInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void wizard.applyCoupon();
            }
          }}
          aria-invalid={Boolean(wizard.couponError)}
          className={cn(inputClass, "font-mono uppercase")}
        />
        <button
          type="button"
          onClick={() => void wizard.applyCoupon()}
          disabled={wizard.couponChecking || !wizard.couponInput.trim()}
          className="inline-flex h-12 shrink-0 items-center gap-2 rounded-xl hairline px-5 text-sm font-medium text-fg transition-colors hover:border-line-strong hover:bg-surface disabled:opacity-60"
        >
          {wizard.couponChecking && <Loader2 aria-hidden className="size-4 animate-spin" />}
          Apply
        </button>
      </div>
      {wizard.couponError ? (
        <p role="alert" className="text-sm text-signal">
          {wizard.couponError}
        </p>
      ) : (
        <p className="text-sm text-muted">Apply it before you pay, so you send the right amount.</p>
      )}
    </div>
  );
}
