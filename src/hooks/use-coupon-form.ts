"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveCouponAction } from "@/app/(admin)/admin/coupons/actions";
import { randomCouponCode, type CouponFormValues } from "@/lib/validation/coupon";

/**
 * Owns the coupon editor: field state, the generated code, and the save. The form
 * component below it only renders.
 */
export function useCouponForm({ couponId, initial }: { couponId: string | null; initial: CouponFormValues }) {
  const router = useRouter();
  const [values, setValues] = useState<CouponFormValues>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, startSave] = useTransition();

  const setField = useCallback(<K extends keyof CouponFormValues>(key: K, value: CouponFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
    setErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const toggleCampaign = useCallback((campaignId: string) => {
    setValues((prev) => ({
      ...prev,
      campaignIds: prev.campaignIds.includes(campaignId)
        ? prev.campaignIds.filter((id) => id !== campaignId)
        : [...prev.campaignIds, campaignId],
    }));
    setSaved(false);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.campaignIds;
      return next;
    });
  }, []);

  const setAppliesTo = useCallback((key: "appliesToIndividual" | "appliesToTeam", value: boolean) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.appliesTo;
      return next;
    });
  }, []);

  const generateCode = useCallback(() => setField("code", randomCouponCode()), [setField]);

  const submit = useCallback(() => {
    setFormError(null);
    setSaved(false);

    startSave(async () => {
      const result = await saveCouponAction({ id: couponId, values });

      if (result.fieldErrors) {
        setErrors(result.fieldErrors);
        setFormError("Check the highlighted fields and try again.");
        return;
      }
      if (result.error || !result.id) {
        setFormError(result.error ?? "Could not save this coupon. Try again in a moment.");
        return;
      }

      setErrors({});
      if (couponId) {
        setSaved(true);
        router.refresh();
      } else {
        router.push(`/admin/coupons/${result.id}`);
      }
    });
  }, [couponId, router, values]);

  return {
    values,
    errors,
    formError,
    saved,
    saving,
    isNew: couponId === null,
    setField,
    toggleCampaign,
    setAppliesTo,
    generateCode,
    submit,
  };
}

export type CouponForm = ReturnType<typeof useCouponForm>;
