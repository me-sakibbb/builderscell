"use client";

import { OfferNotes, OfferPrice } from "@/components/campaigns/offer";
import { ChoiceCard } from "@/components/registration/choice";
import { AmountDue, CouponField } from "@/components/registration/coupon-field";
import { Field, FormError, inputClass } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import {
  HEARD_FROM_OPTIONS,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABEL,
  type PaymentMethod,
} from "@/lib/validation/registration";
import type { PaymentNumber } from "@/lib/queries/campaigns";
import type { CampaignOffers } from "@/lib/validation/coupon";
import type { RegistrationWizard } from "@/hooks/use-registration-wizard";
import { cn } from "@/lib/cn";

/** Step 1: registering alone or as a team, and how big the team is. */
export function TypeStep({
  wizard,
  allowsIndividual,
  allowsTeam,
  individualFee,
  teamFee,
  offers,
  teamMin,
  teamMax,
}: {
  wizard: RegistrationWizard;
  allowsIndividual: boolean;
  allowsTeam: boolean;
  individualFee: number | null;
  teamFee: number | null;
  offers?: CampaignOffers;
  teamMin: number;
  teamMax: number;
}) {
  const sizes = Array.from({ length: teamMax - teamMin + 1 }, (_, i) => teamMin + i);

  return (
    <div className="space-y-6">
      <header>
        <p className="label text-muted">Step 1</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">How are you registering?</h2>
        <p className="mt-2 text-muted">Pick one. A team shares a single Build Box and a single payment.</p>
      </header>

      <div role="radiogroup" aria-label="Registration type" className="grid gap-3">
        {allowsIndividual && (
          <ChoiceCard
            selected={wizard.draft.type === "individual"}
            onSelect={() => wizard.setType("individual")}
            title="Individual"
            body="Just you, with your own Build Box."
            aside={individualFee !== null ? <OfferPrice listed={individualFee} offer={offers?.individual} /> : undefined}
          />
        )}
        {allowsTeam && (
          <ChoiceCard
            selected={wizard.draft.type === "team"}
            onSelect={() => wizard.setType("team")}
            title="Team"
            body={`Up to ${teamMax} members, one shared Build Box.`}
            aside={teamFee !== null ? <OfferPrice listed={teamFee} offer={offers?.team} /> : undefined}
          />
        )}
      </div>

      <OfferNotes offers={offers} />

      {wizard.errors.type && (
        <p role="alert" className="text-sm text-signal">
          {wizard.errors.type}
        </p>
      )}

      {wizard.draft.type === "team" && (
        <div className="space-y-3">
          <h3 className="label text-muted">How many members?</h3>
          <div role="radiogroup" aria-label="Team size" className="flex flex-wrap gap-2">
            {sizes.map((size) => (
              <button
                key={size}
                type="button"
                role="radio"
                aria-checked={wizard.memberCount === size}
                onClick={() => wizard.setMemberCount(size)}
                className={cn(
                  "h-11 min-w-28 rounded-full border px-5 text-sm font-medium transition-colors",
                  wizard.memberCount === size
                    ? "border-accent bg-accent text-accent-fg"
                    : "border-line text-muted hover:border-line-strong hover:text-fg",
                )}
              >
                {size} members
              </button>
            ))}
          </div>
          <p className="text-sm text-muted">The fee is the same whatever the team size.</p>
        </div>
      )}
    </div>
  );
}

/** Step 2: the payment that has already been sent, plus where they heard about us. */
export function PaymentStep({
  wizard,
  instructions,
  numbers,
}: {
  wizard: RegistrationWizard;
  instructions: string | null;
  numbers: PaymentNumber[];
}) {
  const err = (key: string) => wizard.errors[key];

  return (
    <div className="space-y-6">
      <header>
        <p className="label text-muted">Payment</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Confirm your payment</h2>
        {wizard.listedFee !== null && (
          <p className="mt-2 flex flex-wrap items-baseline gap-2 text-muted">
            Amount for this registration: <AmountDue wizard={wizard} />
          </p>
        )}
      </header>

      <CouponField wizard={wizard} />

      {(instructions || numbers.length > 0) && (
        <div className="rounded-2xl hairline bg-surface/60 p-5">
          {instructions && <p className="text-sm leading-relaxed text-muted">{instructions}</p>}
          {numbers.length > 0 && (
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {numbers.map((entry) => (
                <li key={`${entry.method}-${entry.number}`} className="rounded-xl hairline bg-bg-elev px-4 py-3">
                  <span className="block label-xs text-muted">
                    {PAYMENT_METHOD_LABEL[entry.method as PaymentMethod] ?? entry.method}
                  </span>
                  <span className="mt-1 block font-mono text-base text-fg">{entry.number}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-fg">Which did you pay with?</h3>
        <div role="radiogroup" aria-label="Payment method" className="grid gap-3 sm:grid-cols-2">
          {PAYMENT_METHODS.map((method) => (
            <ChoiceCard
              key={method}
              selected={wizard.draft.payment.method === method}
              onSelect={() =>
                wizard.patchDraft({ payment: { ...wizard.draft.payment, method } })
              }
              title={PAYMENT_METHOD_LABEL[method]}
            />
          ))}
        </div>
        {err("payment.method") && (
          <p role="alert" className="text-sm text-signal">
            {err("payment.method")}
          </p>
        )}
      </div>

      <Field
        label="Transaction ID"
        htmlFor="transactionId"
        error={err("payment.transactionId")}
        hint="The ID from the bKash or Nagad confirmation message"
      >
        <input
          id="transactionId"
          type="text"
          maxLength={80}
          autoComplete="off"
          value={wizard.draft.payment.transactionId}
          onChange={(e) =>
            wizard.patchDraft({ payment: { ...wizard.draft.payment, transactionId: e.target.value } })
          }
          aria-invalid={Boolean(err("payment.transactionId"))}
          className={cn(inputClass, "font-mono uppercase")}
        />
      </Field>

      <Field label="How did you hear about us?" htmlFor="heardFrom" hint="Optional">
        <Select
          id="heardFrom"
          value={wizard.draft.heardFrom ?? ""}
          onChange={(e) => wizard.patchDraft({ heardFrom: e.target.value || null })}
        >
          <option value="">Prefer not to say</option>
          {HEARD_FROM_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </Field>

      {wizard.draft.heardFrom === "other" && (
        <Field label="Tell us where" htmlFor="heardFromOther" error={err("heardFromOther")}>
          <input
            id="heardFromOther"
            type="text"
            maxLength={120}
            value={wizard.draft.heardFromOther}
            onChange={(e) => wizard.patchDraft({ heardFromOther: e.target.value })}
            aria-invalid={Boolean(err("heardFromOther"))}
            className={inputClass}
          />
        </Field>
      )}

      <FormError>{wizard.errors.form}</FormError>
    </div>
  );
}
