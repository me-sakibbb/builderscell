import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { RAIL_COOKIE } from "@/components/shell/nav";
import type { Member } from "@/components/shell/sidebar";
import { createClient } from "@/lib/supabase/server";
import type { OnboardingValues } from "@/lib/validation/profile";

/** Everything the app reads or writes on a member profile lives here, not in components. */

/** The signed-in user, verified against Supabase rather than read off a cookie.
 *  Cached per request so a layout and its page share one round trip. */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/** Cached per request: the shell layout and the admin layout both ask. */
export const isCurrentUserAdmin = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.rpc("is_admin", {});
  return data === true;
});

/** The fields a registration form starts pre-filled with. */
export async function getRegistrationProfile(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select(
      "full_name, email, phone, dob, onboarded_at, institution_id, institution_other, class_level, section, roll, guardian_name, guardian_phone, address, institution:institutions(name)",
    )
    .eq("id", userId)
    .maybeSingle();

  return data;
}

export async function getOnboardingState(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("full_name, onboarded_at")
    .eq("id", userId)
    .maybeSingle();

  return data;
}

export const getProfileWithInstitution = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*, institution:institutions(name, short_name, type, eiin, code)")
    .eq("id", userId)
    .maybeSingle();

  return data;
});

export type ProfileWithInstitution = NonNullable<Awaited<ReturnType<typeof getProfileWithInstitution>>>;

/** The gate every dashboard page sits behind: a verified, fully onboarded member.
 *  Both the layout and the page call this; the cache makes that a single query. */
export const requireMember = cache(async () => {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getProfileWithInstitution(user.id);
  if (!profile?.onboarded_at) redirect("/onboarding");

  return { user, profile };
});

/** Two letters for the avatar chip, from the member's name or, failing that, their email. */
export function initialsFrom(value: string) {
  return value
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

/** What the shell frame needs, shared by the member and admin layouts. Resolves a member
 *  when there is one and carries on when not, since the campaign pages are public. */
export async function getShellContext() {
  const user = await getCurrentUser();
  const profile = user ? await getProfileWithInstitution(user.id) : null;
  const isAdmin = user ? await isCurrentUserAdmin() : false;

  const name = profile?.full_name ?? user?.email ?? "";
  const member: Member | null = user
    ? { name, email: profile?.email ?? user.email ?? "", initials: initialsFrom(name || "?") }
    : null;

  const collapsed = (await cookies()).get(RAIL_COOKIE)?.value === "1";

  return { user, member, isAdmin, collapsed };
}

/** Writes the sign-up details form and marks the profile complete. */
export async function saveProfileDetails(userId: string, email: string | null, values: OnboardingValues) {
  const supabase = await createClient();
  const usesCatalogue = Boolean(values.institutionId);

  return supabase
    .from("profiles")
    .update({
      full_name: values.fullName,
      institution_id: usesCatalogue ? values.institutionId : null,
      institution_other: usesCatalogue ? null : values.institutionOther,
      dob: values.dob,
      phone: values.phone,
      email,
      onboarded_at: new Date().toISOString(),
    })
    .eq("id", userId);
}

/** Where a freshly signed-in user belongs: finish sign-up, or carry on to `next`. */
export async function destinationFor(userId: string, next: string) {
  const profile = await getOnboardingState(userId);
  return profile?.onboarded_at ? next : `/onboarding?next=${encodeURIComponent(next)}`;
}
