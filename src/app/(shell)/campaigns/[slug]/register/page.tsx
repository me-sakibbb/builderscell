import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { RegistrationSummary } from "@/components/registration/registration-summary";
import { RegistrationWizardView } from "@/components/registration/registration-wizard";
import { Button } from "@/components/ui/button";
import { campaignPaymentNumbers, getCampaignBySlug, isCampaignFull, registrationWindow } from "@/lib/queries/campaigns";
import { getCurrentUser, getRegistrationProfile } from "@/lib/queries/profile";
import {
  draftFromProfile,
  getDraftRegistration,
  getRegistrationWithMembers,
  getSubmittedRegistration,
} from "@/lib/queries/registrations";
import { parseDraft } from "@/lib/validation/registration";

export const metadata: Metadata = { title: "Register | Builders' Cell" };

/** The wizard reads better narrow than the shell's full content width. */
function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-3xl">{children}</div>;
}

export default async function RegisterPage({ params, searchParams }: PageProps<"/campaigns/[slug]/register">) {
  const { slug } = await params;
  const query = await searchParams;

  const campaign = await getCampaignBySlug(slug);
  if (!campaign) notFound();

  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/campaigns/${slug}/register`)}`);

  const profile = await getRegistrationProfile(user.id);
  if (!profile?.onboarded_at) {
    redirect(`/onboarding?next=${encodeURIComponent(`/campaigns/${slug}/register`)}`);
  }

  const backLink = (
    <Link
      href={`/campaigns/${campaign.slug}`}
      className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-fg"
    >
      <ArrowLeft aria-hidden className="size-4" />
      {campaign.title}
    </Link>
  );

  const submitted = await getSubmittedRegistration(user.id, campaign.id);
  const startingOver = query.again === "1" && submitted?.status === "rejected";

  if (submitted && !startingOver) {
    const detail = await getRegistrationWithMembers(submitted.id);

    return (
      <Shell>
        {backLink}
        <h1 className="display mt-6 text-3xl sm:text-4xl">Your registration</h1>
        <p className="mt-3 text-muted">{campaign.title}</p>

        <div className="mt-8">{detail && <RegistrationSummary registration={detail} />}</div>

        {submitted.status === "rejected" && (
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href={`/campaigns/${campaign.slug}/register?again=1`} size="lg">
              Register again
            </Button>
          </div>
        )}
      </Shell>
    );
  }

  const window = registrationWindow(campaign);
  const full = window.open ? await isCampaignFull(campaign.id) : false;

  if (!window.open || full) {
    return (
      <Shell>
        {backLink}
        <h1 className="display mt-6 text-3xl sm:text-4xl">Registration is closed</h1>
        <p className="mt-4 text-muted">
          {full ? "Every seat for this campaign is taken." : window.reason}
        </p>
        <div className="mt-8">
          <Button href="/campaigns" size="lg" variant="ghost" arrow={false}>
            See other campaigns
          </Button>
        </div>
      </Shell>
    );
  }

  const draftRow = await getDraftRegistration(user.id, campaign.id);
  const initialDraft = draftRow ? parseDraft(draftRow.draft) : draftFromProfile(profile, user.email ?? null);

  return (
    <Shell>
      {backLink}
      <h1 className="display mt-6 text-3xl sm:text-4xl">Register for {campaign.title}</h1>
      <p className="mt-3 text-muted">
        Your answers are saved as you go, so you can leave this page and finish later.
      </p>

      <div className="mt-10">
        <RegistrationWizardView
          campaign={campaign}
          paymentNumbers={campaignPaymentNumbers(campaign.payment_numbers)}
          initialDraft={initialDraft}
          initialStep={draftRow?.step ?? 0}
          initialRegistrationId={draftRow?.id ?? null}
        />
      </div>
    </Shell>
  );
}
