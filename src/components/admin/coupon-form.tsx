"use client";

import { Check, Loader2, Shuffle } from "lucide-react";
import { ChoiceCard } from "@/components/registration/choice";
import { Field, FormError, inputClass } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { useCouponForm } from "@/hooks/use-coupon-form";
import {
  DISCOUNT_TYPES,
  DISCOUNT_TYPE_HINT,
  DISPLAY_MESSAGE_MAX,
  DISCOUNT_TYPE_LABEL,
  type CouponFormValues,
} from "@/lib/validation/coupon";
import { cn } from "@/lib/cn";

/** Labelled on the server: the status labels sit beside server-only queries. */
export type CouponCampaignOption = { id: string; title: string; statusLabel: string };

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-5 rounded-2xl hairline bg-surface/60 p-5">
      <header>
        <h2 className="label text-muted">{title}</h2>
        {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
      </header>
      {children}
    </section>
  );
}

/** Pill checkbox, sized like the wizard's team-size buttons. */
function CheckPill({ checked, onToggle, children }: { checked: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className={cn(
        "inline-flex h-11 items-center gap-2 rounded-full border px-5 text-sm font-medium transition-colors",
        checked ? "border-accent bg-accent text-accent-fg" : "border-line text-muted hover:border-line-strong hover:text-fg",
      )}
    >
      {checked && <Check aria-hidden className="size-4" />}
      {children}
    </button>
  );
}

/** A labelled on/off setting. */
function SwitchRow({
  id,
  title,
  body,
  checked,
  onToggle,
}: {
  id: string;
  title: string;
  body: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl hairline bg-bg-elev px-4 py-3">
      <div>
        <p id={`${id}-label`} className="text-sm font-medium text-fg">
          {title}
        </p>
        <p className="text-sm text-muted">{body}</p>
      </div>
      <Switch aria-labelledby={`${id}-label`} checked={checked} onClick={onToggle} />
    </div>
  );
}

function Alert({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-sm text-signal">
      {message}
    </p>
  );
}

/** Create or edit a coupon. State and the save live in useCouponForm. */
export function CouponForm({
  couponId,
  initial,
  campaigns,
}: {
  couponId: string | null;
  initial: CouponFormValues;
  campaigns: CouponCampaignOption[];
}) {
  const form = useCouponForm({ couponId, initial });
  const { values, errors } = form;
  const priceLabel = values.discountType === "amount_off" ? "off" : "price";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.submit();
      }}
      className="space-y-6"
      noValidate
    >
      <Section title="Code">
        <Field
          label="Coupon code"
          htmlFor="code"
          error={errors.code}
          hint="What members type in. Not case-sensitive; 3 to 32 letters, numbers, dashes or underscores."
        >
          <div className="flex gap-2">
            <input
              id="code"
              type="text"
              maxLength={32}
              autoComplete="off"
              value={values.code}
              onChange={(e) => form.setField("code", e.target.value.toUpperCase())}
              aria-invalid={Boolean(errors.code)}
              className={cn(inputClass, "font-mono uppercase")}
            />
            <button
              type="button"
              onClick={form.generateCode}
              className="inline-flex h-12 shrink-0 items-center gap-2 rounded-xl hairline px-4 text-sm font-medium text-fg transition-colors hover:border-line-strong hover:bg-surface"
            >
              <Shuffle aria-hidden className="size-4" />
              Generate
            </button>
          </div>
        </Field>

        <Field label="Internal note" htmlFor="label" error={errors.label} hint="Optional. Only admins see this.">
          <input
            id="label"
            type="text"
            maxLength={120}
            value={values.label}
            onChange={(e) => form.setField("label", e.target.value)}
            placeholder="e.g. Early bird for school partners"
            className={inputClass}
          />
        </Field>
      </Section>

      <Section title="Discount">
        <div role="radiogroup" aria-label="Discount type" className="grid gap-3 sm:grid-cols-3">
          {DISCOUNT_TYPES.map((type) => (
            <ChoiceCard
              key={type}
              selected={values.discountType === type}
              onSelect={() => form.setField("discountType", type)}
              title={DISCOUNT_TYPE_LABEL[type]}
              body={DISCOUNT_TYPE_HINT[type]}
            />
          ))}
        </div>

        {values.discountType === "percent" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Percentage off" htmlFor="percentOff" error={errors.percentOff} hint="1 to 100">
              <input
                id="percentOff"
                type="number"
                inputMode="numeric"
                min={1}
                max={100}
                value={values.percentOff}
                onChange={(e) => form.setField("percentOff", e.target.value)}
                aria-invalid={Boolean(errors.percentOff)}
                className={cn(inputClass, "font-mono")}
              />
            </Field>
            <Field
              label="Maximum discount (BDT)"
              htmlFor="maxDiscount"
              error={errors.maxDiscount}
              hint="Optional ceiling on the amount taken off"
            >
              <input
                id="maxDiscount"
                type="number"
                inputMode="numeric"
                min={1}
                value={values.maxDiscount}
                onChange={(e) => form.setField("maxDiscount", e.target.value)}
                aria-invalid={Boolean(errors.maxDiscount)}
                className={cn(inputClass, "font-mono")}
              />
            </Field>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {values.appliesToIndividual && (
              <Field
                label={`Individual ${priceLabel} (BDT)`}
                htmlFor="individualValue"
                error={errors.individualValue}
              >
                <input
                  id="individualValue"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={values.individualValue}
                  onChange={(e) => form.setField("individualValue", e.target.value)}
                  aria-invalid={Boolean(errors.individualValue)}
                  className={cn(inputClass, "font-mono")}
                />
              </Field>
            )}
            {values.appliesToTeam && (
              <Field
                label={`Team ${priceLabel} (BDT)`}
                htmlFor="teamValue"
                error={errors.teamValue}
                hint="Applies to the whole team fee"
              >
                <input
                  id="teamValue"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={values.teamValue}
                  onChange={(e) => form.setField("teamValue", e.target.value)}
                  aria-invalid={Boolean(errors.teamValue)}
                  className={cn(inputClass, "font-mono")}
                />
              </Field>
            )}
          </div>
        )}

        {values.discountType === "fixed_price" && (
          <p className="text-sm text-muted">A price above a campaign&apos;s listed fee gives no discount; the listed fee is charged.</p>
        )}
      </Section>

      <Section title="Who can use it">
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-fg">Registration type</h3>
          <div className="flex flex-wrap gap-2">
            <CheckPill
              checked={values.appliesToIndividual}
              onToggle={() => form.setAppliesTo("appliesToIndividual", !values.appliesToIndividual)}
            >
              Individual
            </CheckPill>
            <CheckPill
              checked={values.appliesToTeam}
              onToggle={() => form.setAppliesTo("appliesToTeam", !values.appliesToTeam)}
            >
              Team
            </CheckPill>
          </div>
          <Alert message={errors.appliesTo} />
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-fg">Campaigns</h3>
          <div role="radiogroup" aria-label="Campaign scope" className="grid gap-3 sm:grid-cols-2">
            <ChoiceCard
              selected={!values.allCampaigns}
              onSelect={() => form.setField("allCampaigns", false)}
              title="Selected campaigns"
              body="Only the campaigns ticked below."
            />
            <ChoiceCard
              selected={values.allCampaigns}
              onSelect={() => form.setField("allCampaigns", true)}
              title="Every campaign"
              body="Including campaigns created later."
            />
          </div>

          {!values.allCampaigns &&
            (campaigns.length === 0 ? (
              <p className="text-sm text-muted">There are no campaigns yet.</p>
            ) : (
              <ul className="divide-y divide-line rounded-xl hairline">
                {campaigns.map((campaign) => {
                  const checked = values.campaignIds.includes(campaign.id);
                  return (
                    <li key={campaign.id}>
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={checked}
                        onClick={() => form.toggleCampaign(campaign.id)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface"
                      >
                        <span
                          aria-hidden
                          className={cn(
                            "grid size-5 shrink-0 place-items-center rounded-md border transition-colors",
                            checked ? "border-accent bg-accent text-accent-fg" : "border-line-strong",
                          )}
                        >
                          {checked && <Check className="size-3" />}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm text-fg">{campaign.title}</span>
                        <span className="shrink-0 label-xs text-muted">{campaign.statusLabel}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ))}
          <Alert message={errors.campaignIds} />
        </div>
      </Section>

      <Section
        title="Availability"
        hint="Live only while switched on and inside the window. Times are Bangladesh time (UTC+6)."
      >
        <SwitchRow
          id="isActive"
          title="Switched on"
          body="Off overrides the schedule straight away."
          checked={values.isActive}
          onToggle={() => form.setField("isActive", !values.isActive)}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Starts" htmlFor="startsAt" error={errors.startsAt} hint="Optional. Empty means right away.">
            <input
              id="startsAt"
              type="datetime-local"
              value={values.startsAt}
              onChange={(e) => form.setField("startsAt", e.target.value)}
              aria-invalid={Boolean(errors.startsAt)}
              className={cn(inputClass, "font-mono")}
            />
          </Field>
          <Field label="Ends" htmlFor="endsAt" error={errors.endsAt} hint="Optional. Empty means no end.">
            <input
              id="endsAt"
              type="datetime-local"
              value={values.endsAt}
              onChange={(e) => form.setField("endsAt", e.target.value)}
              aria-invalid={Boolean(errors.endsAt)}
              className={cn(inputClass, "font-mono")}
            />
          </Field>
        </div>

        <Field
          label="Maximum uses"
          htmlFor="maxRedemptions"
          error={errors.maxRedemptions}
          hint="Optional. Pending and approved registrations count; a rejected one frees its use."
        >
          <input
            id="maxRedemptions"
            type="number"
            inputMode="numeric"
            min={1}
            value={values.maxRedemptions}
            onChange={(e) => form.setField("maxRedemptions", e.target.value)}
            aria-invalid={Boolean(errors.maxRedemptions)}
            className={cn(inputClass, "font-mono sm:max-w-56")}
          />
        </Field>
      </Section>

      <Section
        title="Campaign display"
        hint="Advertise this coupon on the campaign cards, campaign page and registration form while it is live."
      >
        <SwitchRow
          id="displayEnabled"
          title="Show on campaigns"
          body="The listed fee is crossed out next to the coupon price. If several displayed coupons apply, the best price is shown."
          checked={values.displayEnabled}
          onToggle={() => form.setField("displayEnabled", !values.displayEnabled)}
        />

        {values.displayEnabled && (
          <>
            <Field
              label="Who it is for"
              htmlFor="displayMessage"
              error={errors.displayMessage}
              hint={`Shown with the price. ${values.displayMessage.trim().length} / ${DISPLAY_MESSAGE_MAX}`}
            >
              <input
                id="displayMessage"
                type="text"
                maxLength={DISPLAY_MESSAGE_MAX}
                value={values.displayMessage}
                onChange={(e) => form.setField("displayMessage", e.target.value)}
                placeholder="e.g. For students of partner schools"
                aria-invalid={Boolean(errors.displayMessage)}
                className={inputClass}
              />
            </Field>

            <SwitchRow
              id="displayShowCode"
              title="Show the code"
              body="Off keeps the code private: members see the price and message, and get the code from you."
              checked={values.displayShowCode}
              onToggle={() => form.setField("displayShowCode", !values.displayShowCode)}
            />
          </>
        )}
      </Section>

      <FormError>{form.formError}</FormError>

      {form.saved && (
        <p role="status" className="rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent-ink">
          Saved. Registrations already submitted keep the price they were given.
        </p>
      )}

      <div className="flex justify-end border-t border-line pt-6">
        <button
          type="submit"
          disabled={form.saving}
          className="inline-flex h-12 items-center gap-2 rounded-xl bg-fg px-6 text-sm font-medium text-bg transition-colors hover:bg-accent hover:text-accent-fg disabled:opacity-60"
        >
          {form.saving && <Loader2 aria-hidden className="size-4 animate-spin" />}
          {form.saving ? "Saving…" : form.isNew ? "Create coupon" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
