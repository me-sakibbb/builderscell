import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CouponForm } from "@/components/admin/coupon-form";
import { listCouponCampaignOptions } from "@/lib/queries/coupons";
import { emptyCouponForm } from "@/lib/validation/coupon";

export const metadata: Metadata = { title: "New coupon | Builders' Cell admin" };

export default async function NewCouponPage() {
  const campaigns = await listCouponCampaignOptions();

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link
        href="/admin/coupons"
        className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-fg"
      >
        <ArrowLeft aria-hidden className="size-4" />
        All coupons
      </Link>

      <h1 className="display mt-6 text-3xl sm:text-4xl">New coupon</h1>
      <p className="mt-2 text-muted">New coupons start switched off, so you can check them before members can use them.</p>

      <div className="mt-8">
        <CouponForm couponId={null} initial={emptyCouponForm()} campaigns={campaigns} />
      </div>
    </div>
  );
}
