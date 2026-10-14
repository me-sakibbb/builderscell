"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser, isCurrentUserAdmin } from "@/lib/queries/profile";
import { deleteCoupon, isCouponReferenced, saveCoupon, setCouponActive } from "@/lib/queries/coupons";
import { couponErrorMessage, couponSchema } from "@/lib/validation/coupon";

export type SaveCouponResult = {
  id?: string;
  error?: string;
  /** Keyed by the form field, e.g. `percentOff`. */
  fieldErrors?: Record<string, string>;
};

export type CouponActionState = { ok?: boolean; error?: string };

/** Every coupon action checks the caller here, and the database checks again. */
async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) return "Your session expired. Sign in again.";
  if (!(await isCurrentUserAdmin())) return "You do not have access to this.";
  return null;
}

function revalidateCoupons(id?: string) {
  revalidatePath("/admin/coupons");
  if (id) revalidatePath(`/admin/coupons/${id}`);
}

/** Create (id null) or edit a coupon. */
export async function saveCouponAction(input: { id: string | null; values: unknown }): Promise<SaveCouponResult> {
  const denied = await requireAdmin();
  if (denied) return { error: denied };

  const parsed = couponSchema.safeParse(input.values);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0] ?? "form")] ??= issue.message;
    }
    return { fieldErrors };
  }

  const { id, error } = await saveCoupon(input.id, parsed.data);
  if (error || !id) {
    const message = couponErrorMessage(error, "Could not save this coupon. Try again in a moment.");
    return error === "coupon_code_taken" ? { fieldErrors: { code: message } } : { error: message };
  }

  revalidateCoupons(id);
  return { id };
}

/** The on/off switch on the list and the edit page. */
export async function toggleCouponAction(_prev: CouponActionState, formData: FormData): Promise<CouponActionState> {
  const denied = await requireAdmin();
  if (denied) return { error: denied };

  const id = String(formData.get("couponId") ?? "");
  const active = formData.get("active") === "true";
  if (!id) return { error: "Pick a coupon." };

  const { error } = await setCouponActive(id, active);
  if (error) return { error: couponErrorMessage(error, "Could not switch this coupon. Try again in a moment.") };

  revalidateCoupons(id);
  return { ok: true };
}

/** Only a coupon no registration has used can go; a used one stays for the record. */
export async function deleteCouponAction(_prev: CouponActionState, formData: FormData): Promise<CouponActionState> {
  const denied = await requireAdmin();
  if (denied) return { error: denied };

  const id = String(formData.get("couponId") ?? "");
  if (!id) return { error: "Pick a coupon." };

  if (await isCouponReferenced(id)) {
    return { error: "Registrations already use this coupon, so it stays on record. Switch it off instead." };
  }

  const { error } = await deleteCoupon(id);
  if (error) return { error: "Could not delete this coupon. Try again in a moment." };

  revalidateCoupons();
  redirect("/admin/coupons");
}
