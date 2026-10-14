import Link from "next/link";
import { CouponToggle } from "@/components/admin/coupon-controls";
import type { CouponRow } from "@/lib/queries/coupons";
import {
  COUPON_STATE_LABEL,
  couponDateTime,
  couponState,
  describeAppliesTo,
  describeDiscount,
  usesLabel,
  type CouponState,
} from "@/lib/validation/coupon";
import { cn } from "@/lib/cn";

const TONE: Record<CouponState, string> = {
  live: "border-accent bg-accent/10 text-accent-ink",
  scheduled: "border-line-strong text-fg",
  off: "border-line text-muted",
  expired: "border-line text-muted",
  used_up: "border-signal/40 bg-signal/10 text-signal",
};

export function CouponStateBadge({ state, className }: { state: CouponState; className?: string }) {
  return (
    <span className={cn("inline-flex h-7 items-center rounded-full border px-3 label-xs", TONE[state], className)}>
      {COUPON_STATE_LABEL[state]}
    </span>
  );
}

/** "From 15 Oct 2026, 09:00 to 31 Oct 2026, 23:59", or null when there is no window. */
export function scheduleLabel(startsAt: string | null, endsAt: string | null) {
  if (!startsAt && !endsAt) return null;
  if (startsAt && endsAt) {
    return `${couponDateTime.format(new Date(startsAt))} to ${couponDateTime.format(new Date(endsAt))}`;
  }
  return startsAt
    ? `From ${couponDateTime.format(new Date(startsAt))}`
    : `Until ${couponDateTime.format(new Date(endsAt as string))}`;
}

/** Coupons as a list: what each does, whether it is live, and its uses against the cap. */
export function CouponList({ items, now, className }: { items: CouponRow[]; now: Date; className?: string }) {
  return (
    <ul className={cn("divide-y divide-line border-y border-line", className)}>
      {items.map((row) => {
        const used = row.pending_uses + row.approved_uses;
        const state = couponState(row, used, now);
        const schedule = scheduleLabel(row.starts_at, row.ends_at);
        const scope = row.all_campaigns ? "Every campaign" : row.campaign_titles.join(", ") || "No campaigns";

        return (
          <li key={row.id} className="grid gap-4 py-5 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-6 sm:px-2">
            <Link href={`/admin/coupons/${row.id}`} className="group min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-base font-medium text-fg group-hover:text-accent-ink">{row.code}</span>
                <CouponStateBadge state={state} />
                {row.display_enabled && (
                  <span className="inline-flex h-7 items-center rounded-full border border-line px-3 label-xs text-muted">
                    On display
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-fg">{describeDiscount(row)}</p>
              <p className="mt-1 truncate text-sm text-muted">
                {scope} · {describeAppliesTo(row)}
                {row.label ? ` · ${row.label}` : ""}
              </p>
              {schedule && <p className="mt-1 font-mono text-[11px] text-muted">{schedule}</p>}
            </Link>

            <dl className="grid grid-cols-2 gap-4 font-mono text-[11px] text-muted sm:gap-6">
              <div className="sm:text-right">
                <dt className="label-xs">Uses</dt>
                <dd className="mt-1 text-sm tabular-nums text-fg">{usesLabel(used, row.max_redemptions)}</dd>
              </div>
              <div className="sm:text-right">
                <dt className="label-xs">Approved</dt>
                <dd className="mt-1 text-sm tabular-nums text-fg">{row.approved_uses}</dd>
              </div>
            </dl>

            <CouponToggle couponId={row.id} active={row.is_active} code={row.code} className="sm:items-end" />
          </li>
        );
      })}
    </ul>
  );
}
