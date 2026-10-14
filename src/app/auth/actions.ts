"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AuthError } from "@supabase/supabase-js";
import { emailSchema, onboardingSchema, otpSchema, passwordSchema } from "@/lib/validation/profile";
import { safeNext } from "@/lib/auth";
import { destinationFor, saveProfileDetails } from "@/lib/queries/profile";

export type AuthState = { error?: string; sent?: boolean; email?: string };
export type OnboardingState = { error?: string; fieldErrors?: Record<string, string> };

const nextFrom = (value: FormDataEntryValue | null) => safeNext(typeof value === "string" ? value : null);

const isRateLimited = (error: AuthError) => error.code === "over_email_send_rate_limit" || error.status === 429;

/** Messages for failures shared by every email-sending step. */
function sendError(error: AuthError, email: string): AuthState {
  if (isRateLimited(error)) return { error: "Too many codes requested. Wait a few minutes and try again.", email };
  return { error: error.message, email };
}

function codeError(error: AuthError | null): string {
  return error?.code === "otp_expired"
    ? "That code has expired. Ask for a new one."
    : "That code is not right. Check the email and try again.";
}

async function finishSignIn(userId: string, formData: FormData): Promise<never> {
  const target = await destinationFor(userId, nextFrom(formData.get("next")));
  revalidatePath("/", "layout");
  redirect(target);
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) return { error: email.error.issues[0].message };

  const password = formData.get("password");
  if (typeof password !== "string" || !password) return { error: "Enter your password", email: email.data };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.data, password });

  if (error || !data.user) {
    if (error?.code === "invalid_credentials") return { error: "That email and password don't match.", email: email.data };
    if (error?.code === "email_not_confirmed") {
      return { error: "This email isn't confirmed yet. Create an account with it again to get a new code.", email: email.data };
    }
    if (error && isRateLimited(error)) return { error: "Too many attempts. Wait a few minutes and try again.", email: email.data };
    return { error: error?.message ?? "Could not sign you in. Try again.", email: email.data };
  }

  return finishSignIn(data.user.id, formData);
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) return { error: email.error.issues[0].message };

  const password = passwordSchema.safeParse(formData.get("password"));
  if (!password.success) return { error: password.error.issues[0].message, email: email.data };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email: email.data, password: password.data });

  if (error) {
    if (error.code === "user_already_exists") return { error: "An account already uses that email. Sign in instead.", email: email.data };
    return sendError(error, email.data);
  }
  // With email confirmation on, Supabase hides existing accounts behind a user with no identities.
  if (data.user?.identities?.length === 0) {
    return { error: "An account already uses that email. Sign in instead.", email: email.data };
  }

  return { sent: true, email: email.data };
}

export async function resendSignupCode(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) return { error: email.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({ type: "signup", email: email.data });
  if (error) return sendError(error, email.data);

  return { sent: true, email: email.data };
}

export async function verifySignup(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = emailSchema.safeParse(formData.get("email"));
  const token = otpSchema.safeParse(formData.get("token"));
  if (!email.success) return { error: email.error.issues[0].message, sent: true };
  if (!token.success) return { error: token.error.issues[0].message, sent: true, email: email.data };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({ email: email.data, token: token.data, type: "email" });
  if (error || !data.user) return { error: codeError(error), sent: true, email: email.data };

  return finishSignIn(data.user.id, formData);
}

export async function sendResetCode(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) return { error: email.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email.data);
  if (error) return sendError(error, email.data);

  return { sent: true, email: email.data };
}

export async function resetPassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) return { error: email.error.issues[0].message, sent: true };
  const password = passwordSchema.safeParse(formData.get("password"));
  if (!password.success) return { error: password.error.issues[0].message, sent: true, email: email.data };

  const supabase = await createClient();

  // A code is single-use: when a previous attempt verified it but the password update failed,
  // the recovery session is already in place, so skip straight to the update.
  const {
    data: { user: current },
  } = await supabase.auth.getUser();
  let userId = current?.email === email.data ? current.id : null;

  if (!userId) {
    const token = otpSchema.safeParse(formData.get("token"));
    if (!token.success) return { error: token.error.issues[0].message, sent: true, email: email.data };

    const { data, error } = await supabase.auth.verifyOtp({ email: email.data, token: token.data, type: "recovery" });
    if (error || !data.user) return { error: codeError(error), sent: true, email: email.data };
    userId = data.user.id;
  }

  const { error } = await supabase.auth.updateUser({ password: password.data });
  if (error) {
    const message =
      error.code === "same_password" ? "That is already your password. Pick a different one." : error.message;
    return { error: message, sent: true, email: email.data };
  }

  return finishSignIn(userId, formData);
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
    if (error.code === "23505" && error.message.includes("profiles_email_lower_key")) {
      return { error: "That email address is already on another account." };
    }
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
