"use client";

import { useActionState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import {
  deleteCouponAction,
  toggleCouponAction,
  type CouponActionState,
} from "@/app/(admin)/admin/coupons/actions";
import { FormError } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/cn";

const EMPTY: CouponActionState = {};

/** The master on/off switch. Submits straight away; the page re-renders with the result. */
export function CouponToggle({
  couponId,
  active,
  code,
  className,
}: {
  couponId: string;
  active: boolean;
  code: string;
  className?: string;
}) {
  const [state, action, pending] = useActionState(toggleCouponAction, EMPTY);

  return (
    <form action={action} className={cn("flex flex-col items-end gap-1", className)}>
      <input type="hidden" name="couponId" value={couponId} />
      <input type="hidden" name="active" value={String(!active)} />
      <div className="flex items-center gap-2">
        {pending && <Loader2 aria-hidden className="size-4 animate-spin text-muted" />}
        <span className="label-xs text-muted">{active ? "On" : "Off"}</span>
        <Switch
          type="submit"
          checked={active}
          disabled={pending}
          aria-label={active ? `Switch ${code} off` : `Switch ${code} on`}
        />
      </div>
      {state.error && (
        <p role="alert" className="max-w-56 text-right text-xs text-signal">
          {state.error}
        </p>
      )}
    </form>
  );
}

/** Removes a coupon nobody has used. Two clicks, so a stray one does nothing. */
export function CouponDelete({ couponId }: { couponId: string }) {
  const [state, action, pending] = useActionState(deleteCouponAction, EMPTY);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="couponId" value={couponId} />
      <details className="group">
        <summary className="inline-flex cursor-pointer list-none items-center gap-2 text-sm text-muted transition-colors hover:text-signal">
          <Trash2 aria-hidden className="size-4" />
          Delete this coupon
        </summary>
        <div className="mt-3 space-y-3 rounded-xl border border-signal/30 bg-signal/10 p-4">
          <p className="text-sm text-fg">
            This removes the coupon for good. A coupon that registrations have used cannot be deleted; switch it off
            instead.
          </p>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-signal/40 px-5 text-sm font-medium text-signal transition-colors hover:bg-signal/10 disabled:opacity-60"
          >
            {pending ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Trash2 aria-hidden className="size-4" />}
            Delete for good
          </button>
        </div>
      </details>
      <FormError>{state.error}</FormError>
    </form>
  );
}
