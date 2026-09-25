import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { OnboardingForm } from "@/components/auth/onboarding-form";
import { createClient } from "@/lib/supabase/server";
import { getOnboardingState } from "@/lib/queries/profile";
import { safeNext } from "@/lib/auth";

export const metadata: Metadata = { title: "Finish signing up | Builder'sCell" };

export default async function OnboardingPage(props: PageProps<"/onboarding">) {
  const { next } = await props.searchParams;
  const target = safeNext(typeof next === "string" ? next : null);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getOnboardingState(user.id);
  if (profile?.onboarded_at) redirect(target);

  const metadataName = user.user_metadata?.full_name ?? user.user_metadata?.name ?? "";

  return (
    <AuthCard
      eyebrow="One last step"
      title="Tell us who's building"
      lead="This is how we'll know you at the bootcamp, the lab and the shop."
    >
      <OnboardingForm
        defaultName={profile?.full_name ?? String(metadataName)}
        email={user.email ?? ""}
        next={target}
      />
    </AuthCard>
  );
}
