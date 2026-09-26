"use client";

import { useEffect, useRef } from "react";
import { ArrowLeft, ArrowRight, Check, CloudOff, Loader2 } from "lucide-react";
import { MemberStep } from "@/components/registration/member-step";
import { PaymentStep, TypeStep } from "@/components/registration/steps";
import { ReviewStep } from "@/components/registration/review-step";
import { FormError } from "@/components/ui/field";
import { useRegistrationWizard } from "@/hooks/use-registration-wizard";
import type { Campaign, PaymentNumber } from "@/lib/queries/campaigns";
import type { DraftValues } from "@/lib/validation/registration";
import { cn } from "@/lib/cn";

type Props = {
  campaign: Pick<
    Campaign,
    | "slug"
    | "allows_individual"
    | "allows_team"
    | "individual_fee_bdt"
    | "team_fee_bdt"
    | "team_min_members"
    | "team_max_members"
    | "min_class_level"
    | "max_class_level"
    | "payment_instructions"
  >;
  paymentNumbers: PaymentNumber[];
  initialDraft: DraftValues;
  initialStep: number;
  initialRegistrationId: string | null;
};

function SaveIndicator({ state }: { state: "idle" | "saving" | "saved" | "error" }) {
  if (state === "idle") return null;

  const content = {
    saving: { icon: <Loader2 aria-hidden className="size-3.5 animate-spin" />, text: "Saving", tone: "text-muted" },
    saved: { icon: <Check aria-hidden className="size-3.5" />, text: "Draft saved", tone: "text-muted" },
    error: { icon: <CloudOff aria-hidden className="size-3.5" />, text: "Not saved", tone: "text-signal" },
  }[state];

  return (
    <p aria-live="polite" className={cn("flex items-center gap-1.5 label-xs", content.tone)}>
      {content.icon}
      {content.text}
    </p>
  );
}

/** The registration form: one step at a time, autosaved as a draft until it is submitted. */
export function RegistrationWizardView({
  campaign,
  paymentNumbers,
  initialDraft,
  initialStep,
  initialRegistrationId,
}: Props) {
  const wizard = useRegistrationWizard({
    campaignSlug: campaign.slug,
    initialDraft,
    initialStep,
    initialRegistrationId,
    allowsIndividual: campaign.allows_individual,
    allowsTeam: campaign.allows_team,
    teamMin: campaign.team_min_members,
    teamMax: campaign.team_max_members,
    minClassLevel: campaign.min_class_level,
    maxClassLevel: campaign.max_class_level,
  });

  const top = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [wizard.step]);

  const fee =
    wizard.draft.type === "team" ? campaign.team_fee_bdt : wizard.draft.type === "individual" ? campaign.individual_fee_bdt : null;

  const isLast = wizard.current.kind === "review";

  return (
    <div ref={top} className="scroll-mt-24">
      <ol className="mb-8 flex flex-wrap items-center gap-2" aria-label="Registration steps">
        {wizard.steps.map((step, index) => {
          const label =
            step.kind === "type"
              ? "Type"
              : step.kind === "member"
                ? `Member ${step.index + 1}`
                : step.kind === "payment"
                  ? "Payment"
                  : "Review";
          const done = index < wizard.step;
          const current = index === wizard.step;

          return (
            <li key={label}>
              <button
                type="button"
                onClick={() => wizard.goTo(index)}
                aria-current={current ? "step" : undefined}
                className={cn(
                  "h-8 rounded-full border px-3.5 label-xs transition-colors",
                  current
                    ? "border-accent bg-accent text-accent-fg"
                    : done
                      ? "border-line-strong text-fg hover:bg-surface"
                      : "border-line text-muted hover:text-fg",
                )}
              >
                {label}
              </button>
            </li>
          );
        })}
      </ol>

      {wizard.current.kind === "type" && (
        <TypeStep
          wizard={wizard}
          allowsIndividual={campaign.allows_individual}
          allowsTeam={campaign.allows_team}
          individualFee={campaign.individual_fee_bdt}
          teamFee={campaign.team_fee_bdt}
          teamMin={campaign.team_min_members}
          teamMax={campaign.team_max_members}
        />
      )}

      {wizard.current.kind === "member" && (
        <MemberStep
          wizard={wizard}
          index={wizard.current.index}
          minClassLevel={campaign.min_class_level}
          maxClassLevel={campaign.max_class_level}
        />
      )}

      {wizard.current.kind === "payment" && (
        <PaymentStep
          wizard={wizard}
          fee={fee}
          instructions={campaign.payment_instructions}
          numbers={paymentNumbers}
        />
      )}

      {wizard.current.kind === "review" && <ReviewStep wizard={wizard} fee={fee} />}

      {wizard.current.kind !== "review" && <FormError>{wizard.formError}</FormError>}

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
        <SaveIndicator state={wizard.saveState} />

        <div className="ml-auto flex items-center gap-3">
          {wizard.step > 0 && (
            <button
              type="button"
              onClick={wizard.back}
              disabled={wizard.submitting}
              className="inline-flex h-12 items-center gap-2 rounded-xl px-5 text-sm font-medium text-muted transition-colors hover:text-fg disabled:opacity-60"
            >
              <ArrowLeft aria-hidden className="size-4" />
              Back
            </button>
          )}

          <button
            type="button"
            onClick={isLast ? wizard.submit : wizard.next}
            disabled={wizard.submitting || wizard.submitted}
            className="inline-flex h-12 items-center gap-2 rounded-xl bg-fg px-6 text-sm font-medium text-bg transition-colors hover:bg-accent hover:text-accent-fg disabled:opacity-60"
          >
            {wizard.submitting && <Loader2 aria-hidden className="size-4 animate-spin" />}
            {isLast ? (wizard.submitting ? "Submitting…" : "Submit registration") : "Continue"}
            {!isLast && <ArrowRight aria-hidden className="size-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
