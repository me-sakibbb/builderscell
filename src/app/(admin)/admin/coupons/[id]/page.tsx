import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { CouponDelete } from "@/components/admin/coupon-controls";
import { CouponForm } from "@/components/admin/coupon-form";
import { CouponStateBadge, scheduleLabel } from "@/components/admin/coupon-list";
import { StatTiles } from "@/components/admin/stat-tiles";
import { getCoupon, listCouponCampaignOptions } from "@/lib/queries/coupons";
import { couponFormFromRow, couponState, describeDiscount, usesLabel } from "@/lib/validation/coupon";

export const metadata: Metadata = { title: "Edit coupon | Builders' Cell admin" };

export default async function EditCouponPage({ params }: PageProps<"/admin/coupons/[id]">) {
  const { id } = await params;
  const [coupon, campaigns] = await Promise.all([getCoupon(id), listCouponCampaignOptions()]);
  if (!coupon) notFound();

  const used = coupon.pending + coupon.approved;
  const schedule = scheduleLabel(coupon.starts_at, coupon.ends_at);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link
        href="/admin/coupons"
        className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-fg"
      >
        <ArrowLeft aria-hidden className="size-4" />
        All coupons
      </Link>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <h1 className="display font-mono text-3xl sm:text-4xl">{coupon.code}</h1>
        <CouponStateBadge state={couponState(coupon, used, new Date())} />
      </div>
      <p className="mt-2 text-muted">
        {describeDiscount(coupon)}
        {schedule ? ` · ${schedule}` : ""}
      </p>

      <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
        <StatTiles
          stats={[
            { label: "Uses", value: usesLabel(used, coupon.max_redemptions) },
            { label: "Pending", value: String(coupon.pending) },
            { label: "Approved", value: String(coupon.approved) },
          ]}
        />
        {used > 0 && (
          <Link
            href={`/admin/registrations?coupon=${encodeURIComponent(coupon.code)}`}
            className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-fg"
          >
            Registrations using it
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        )}
      </div>

      <div className="mt-8">
        <CouponForm
          couponId={coupon.id}
          initial={couponFormFromRow(coupon, coupon.campaignIds)}
          campaigns={campaigns}
        />
      </div>

      <div className="mt-10 border-t border-line pt-6">
        <CouponDelete couponId={coupon.id} />
      </div>
    </div>
  );
}
