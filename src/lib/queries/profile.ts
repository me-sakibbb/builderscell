import { createClient } from "@/lib/supabase/server";
import type { OnboardingValues } from "@/lib/validation/profile";

/** Everything the app reads or writes on a member profile lives here, not in components. */

export async function getOnboardingState(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("full_name, onboarded_at")
    .eq("id", userId)
    .maybeSingle();

  return data;
}

export async function getProfileWithInstitution(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*, institution:institutions(name, short_name, type, eiin, code)")
    .eq("id", userId)
    .maybeSingle();

  return data;
}

export type ProfileWithInstitution = NonNullable<Awaited<ReturnType<typeof getProfileWithInstitution>>>;

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
