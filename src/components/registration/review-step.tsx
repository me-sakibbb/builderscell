"use client";

import { Pencil } from "lucide-react";
import { bdt } from "@/content/site";
import { AmountDue } from "@/components/registration/coupon-field";
import { FormError } from "@/components/ui/field";
import { HEARD_FROM_LABEL, PAYMENT_METHOD_LABEL, type PaymentMethod } from "@/lib/validation/registration";
import type { RegistrationWizard } from "@/hooks/use-registration-wizard";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-line py-3 last:border-0 sm:grid-cols-[11rem_1fr] sm:gap-4">
      <dt className="label-xs text-muted">{label}</dt>
      <dd className="text-sm break-words text-fg">{value || "—"}</dd>
    </div>
  );
}

/** Last step: everything as it will be submitted, with a way back into each part. */
export function ReviewStep({ wizard }: { wizard: RegistrationWizard }) {
  const { draft } = wizard;
  const members = draft.members.slice(0, wizard.memberCount);

  return (
    <div className="space-y-6">
      <header>
        <p className="label text-muted">Review</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Check it over</h2>
        <p className="mt-2 text-muted">
          Once submitted, we verify the payment and get back to you. Nothing can be edited after this point.
        </p>
      </header>

      <div className="rounded-2xl hairline bg-surface/60 p-5">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="text-base font-medium text-fg">
            {draft.type === "team" ? `Team of ${members.length}` : "Individual registration"}
          </h3>
          <AmountDue wizard={wizard} className="text-base" />
        </div>
      </div>

      {members.map((member, index) => (
        <section key={index} className="rounded-2xl hairline bg-surface/60 p-5">
          <div className="mb-2 flex items-center justify-between gap-4">
            <h3 className="label text-muted">
              Participant {index + 1}
              {member.linkedUserId ? " · member account" : ""}
            </h3>
            <button
              type="button"
              onClick={() => wizard.goTo(index + 1)}
              className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-fg"
            >
              <Pencil aria-hidden className="size-3.5" />
              Edit
            </button>
          </div>
          <dl>
            <Row label="Name" value={member.fullName} />
            <Row label="Phone" value={member.phone ? `+880 ${member.phone}` : ""} />
            <Row label="Email" value={member.email} />
            <Row label="Date of birth" value={member.dob} />
            <Row
              label="Institution"
              value={member.institutionName || member.institutionOther}
            />
            <Row
              label="Class"
              value={[member.classLevel && `Class ${member.classLevel}`, member.section && `Section ${member.section}`, member.roll && `Roll ${member.roll}`]
                .filter(Boolean)
                .join(" · ")}
            />
            <Row label="Guardian" value={member.guardianName} />
            <Row label="Guardian phone" value={member.guardianPhone ? `+880 ${member.guardianPhone}` : ""} />
            <Row label="Address" value={member.address} />
          </dl>
        </section>
      ))}

      <section className="rounded-2xl hairline bg-surface/60 p-5">
        <div className="mb-2 flex items-center justify-between gap-4">
          <h3 className="label text-muted">Payment</h3>
          <button
            type="button"
            onClick={() => wizard.goTo(wizard.steps.length - 2)}
            className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-fg"
          >
            <Pencil aria-hidden className="size-3.5" />
            Edit
          </button>
        </div>
        <dl>
          <Row
            label="Method"
            value={draft.payment.method ? PAYMENT_METHOD_LABEL[draft.payment.method as PaymentMethod] : ""}
          />
          <Row label="Transaction ID" value={<span className="font-mono">{draft.payment.transactionId}</span>} />
          {wizard.coupon && (
            <Row
              label="Coupon"
              value={
                <span>
                  <span className="font-mono">{wizard.coupon.code}</span>
                  <span className="text-muted"> · −{bdt(wizard.coupon.discount)}</span>
                </span>
              }
            />
          )}
          <Row
            label="Heard about us"
            value={
              draft.heardFrom === "other"
                ? draft.heardFromOther
                : draft.heardFrom
                  ? HEARD_FROM_LABEL[draft.heardFrom]
                  : ""
            }
          />
        </dl>
      </section>

      <FormError>{wizard.formError}</FormError>
    </div>
  );
}
