import { StatusBadge } from "@/components/registration/status-badge";
import { bdt } from "@/content/site";
import type { RegistrationDetail } from "@/lib/queries/registrations";
import { HEARD_FROM_LABEL, PAYMENT_METHOD_LABEL, type PaymentMethod } from "@/lib/validation/registration";
import { INSTITUTION_TYPE_LABEL } from "@/lib/validation/profile";

const dateTime = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const date = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });

const STATUS_NOTE: Record<string, string> = {
  pending: "We are verifying your payment. You will hear from us on the phone number below.",
  approved: "Your place is confirmed. We will be in touch with the schedule before the first session.",
  rejected: "This registration was not accepted. The note below explains why.",
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-line py-3 last:border-0 sm:grid-cols-[11rem_1fr] sm:gap-4">
      <dt className="label-xs text-muted">{label}</dt>
      <dd className="text-sm break-words text-fg">{value || "—"}</dd>
    </div>
  );
}

/** One submitted registration, as the member who sent it sees it (and admins on review). */
export function RegistrationSummary({
  registration,
  showContactDetails = true,
}: {
  registration: RegistrationDetail;
  showContactDetails?: boolean;
}) {
  const members = [...(registration.members ?? [])].sort((a, b) => a.position - b.position);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl hairline bg-surface/60 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StatusBadge status={registration.status} />
          {registration.submitted_at && (
            <span className="text-xs text-muted">
              Submitted {dateTime.format(new Date(registration.submitted_at))}
            </span>
          )}
        </div>
        {STATUS_NOTE[registration.status] && (
          <p className="mt-3 text-sm leading-relaxed text-muted">{STATUS_NOTE[registration.status]}</p>
        )}
        {registration.review_note && (
          <p className="mt-3 rounded-xl hairline bg-bg-elev px-4 py-3 text-sm text-fg">{registration.review_note}</p>
        )}
      </div>

      <section className="rounded-2xl hairline bg-surface/60 p-5">
        <h3 className="label text-muted">Payment</h3>
        <dl className="mt-2">
          <Row
            label="Type"
            value={registration.type === "team" ? `Team of ${registration.member_count}` : "Individual"}
          />
          <Row label="Amount" value={registration.fee_bdt !== null ? bdt(registration.fee_bdt) : ""} />
          <Row
            label="Method"
            value={
              registration.payment_method
                ? PAYMENT_METHOD_LABEL[registration.payment_method as PaymentMethod] ?? registration.payment_method
                : ""
            }
          />
          <Row label="Transaction ID" value={<span className="font-mono">{registration.transaction_id}</span>} />
          <Row
            label="Heard about us"
            value={
              registration.heard_from === "other"
                ? registration.heard_from_other
                : registration.heard_from
                  ? HEARD_FROM_LABEL[registration.heard_from]
                  : ""
            }
          />
        </dl>
      </section>

      {members.map((member) => (
        <section key={member.id} className="rounded-2xl hairline bg-surface/60 p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h3 className="label text-muted">
              Participant {member.position}
              {member.user_id ? " · member account" : ""}
            </h3>
          </div>
          <dl className="mt-2">
            <Row label="Name" value={member.full_name} />
            <Row
              label="Institution"
              value={
                member.institution ? (
                  <span>
                    {member.institution.name}
                    <span className="mt-0.5 block font-mono text-[11px] text-muted">
                      {[
                        INSTITUTION_TYPE_LABEL[member.institution.type] ?? member.institution.type,
                        member.institution.eiin
                          ? `EIIN ${member.institution.eiin}`
                          : member.institution.code
                            ? `Code ${member.institution.code}`
                            : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                ) : (
                  member.institution_other
                )
              }
            />
            <Row
              label="Class"
              value={[`Class ${member.class_level}`, `Section ${member.section}`, `Roll ${member.roll}`].join(" · ")}
            />
            {showContactDetails && (
              <>
                <Row label="Phone" value={<span className="font-mono">{member.phone}</span>} />
                <Row label="Email" value={member.email} />
                <Row label="Date of birth" value={date.format(new Date(member.dob))} />
                <Row label="Guardian" value={member.guardian_name} />
                <Row label="Guardian phone" value={<span className="font-mono">{member.guardian_phone}</span>} />
                <Row label="Address" value={member.address} />
              </>
            )}
          </dl>
        </section>
      ))}
    </div>
  );
}
