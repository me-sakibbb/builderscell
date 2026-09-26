"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { emailSchema, onboardingSchema, otpSchema } from "@/lib/validation/profile";
import { safeNext } from "@/lib/auth";
import { destinationFor, saveProfileDetails } from "@/lib/queries/profile";

export type AuthState = { error?: string; sent?: boolean; email?: string };
export type OnboardingState = { error?: string; fieldErrors?: Record<string, string> };

const nextFrom = (value: FormDataEntryValue | null) => safeNext(typeof value === "string" ? value : null);

export async function sendOtp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const email = parsed.data;
  const isSignup = formData.get("intent") === "signup";
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: isSignup },
  });

  if (error) {
    if (error.code === "otp_disabled") {
      return { error: "No account uses that email yet. Create one instead.", email };
    }
    if (error.code === "over_email_send_rate_limit" || error.status === 429) {
      return { error: "Too many codes requested. Wait a few minutes and try again.", email };
    }
    return { error: error.message, email };
  }

  return { sent: true, email };
}

export async function verifyOtp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = emailSchema.safeParse(formData.get("email"));
  const token = otpSchema.safeParse(formData.get("token"));
  if (!email.success) return { error: email.error.issues[0].message, sent: true };
  if (!token.success) return { error: token.error.issues[0].message, sent: true, email: email.data };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email: email.data,
    token: token.data,
    type: "email",
  });

  if (error || !data.user) {
    const message =
      error?.code === "otp_expired"
        ? "That code has expired. Ask for a new one."
        : "That code is not right. Check the email and try again.";
    return { error: message, sent: true, email: email.data };
  }

  const target = await destinationFor(data.user.id, nextFrom(formData.get("next")));
  revalidatePath("/", "layout");
  redirect(target);
}

export async function completeOnboarding(_prev: OnboardingState, formData: FormData): Promise<OnboardingState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = onboardingSchema.safeParse({
    fullName: formData.get("fullName") ?? "",
    institutionId: formData.get("institutionId") || null,
    institutionOther: formData.get("institutionOther") ?? "",
    dob: formData.get("dob") ?? "",
    phone: formData.get("phone") ?? "",
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return { fieldErrors };
  }

  const { error } = await saveProfileDetails(user.id, user.email ?? null, parsed.data);

  if (error) {
    if (error.code === "23505") {
      return { fieldErrors: { phone: "That phone number is already on another account." } };
    }
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect(nextFrom(formData.get("next")));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
