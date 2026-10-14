"use client";

import { CheckCircle2 } from "lucide-react";
import { fest } from "@/content/site";
import { InstitutionSelect } from "@/components/auth/institution-select";
import { SubmitButton } from "@/components/auth/submit-button";
import { SectionHeading } from "@/components/ui/reveal";
import { Field, FormError, inputClass } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { useLeadForm } from "@/hooks/use-lead-form";
import { LEAD_GRADE_LABEL, LEAD_GRADES } from "@/lib/validation/lead";
import { cn } from "@/lib/cn";

/** Lead form for the outreach event in `fest`. No account needed; leads land in the admin panel. */
export function Fest() {
  const { values, setField, setInstitution, trap, setTrap, errors, formError, sent, sending, submit, reset } =
    useLeadForm(fest.event);

  return (
    <section id="fest" className="relative z-10 bg-bg py-28 sm:py-40">
      <div className="container-x grid gap-14 lg:grid-cols-[1fr_minmax(0,30rem)] lg:items-start">
        <div className="lg:sticky lg:top-32">
          <SectionHeading eyebrow={fest.eyebrow} title={fest.title} body={fest.body} titleClassName="max-w-[16ch]" />
          <dl data-reveal className="mt-10 grid gap-x-8 gap-y-5 border-t border-line pt-8 sm:grid-cols-2">
            {fest.details.map((d) => (
              <div key={d.k}>
                <dt className="label-xs text-muted">{d.k}</dt>
                <dd className="mt-1.5 text-fg">{d.v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div data-reveal className="rounded-3xl hairline bg-surface p-6 sm:p-8">
          {sent ? (
            <div role="status" className="flex flex-col items-start gap-5 py-6">
              <CheckCircle2 aria-hidden className="size-10 text-accent-ink" />
              <p className="text-xl font-medium tracking-tight text-fg">{fest.form.success}</p>
              <button
                type="button"
                onClick={reset}
                className="h-12 rounded-xl hairline px-6 text-sm font-medium text-fg transition-colors hover:border-line-strong hover:bg-bg-elev"
              >
                {fest.form.again}
              </button>
            </div>
          ) : (
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
              className="space-y-5"
            >
              <h3 className="text-2xl font-semibold tracking-tight">{fest.form.title}</h3>

              <Field label="Full name" htmlFor="lead-name" error={errors.fullName}>
                <input
                  id="lead-name"
                  type="text"
                  required
                  autoComplete="name"
                  maxLength={80}
                  value={values.fullName}
                  onChange={(e) => setField("fullName", e.target.value)}
                  aria-invalid={Boolean(errors.fullName)}
                  className={inputClass}
                />
              </Field>

              <Field label="Phone number" htmlFor="lead-phone" error={errors.phone} hint="Bangladeshi mobile number">
                <div className="flex items-stretch">
                  <span className="flex items-center rounded-l-xl border border-r-0 border-line bg-bg-elev px-3 font-mono text-sm text-muted">
                    +880
                  </span>
                  <input
                    id="lead-phone"
                    type="tel"
                    required
                    inputMode="numeric"
                    autoComplete="tel-national"
                    placeholder="1712 345678"
                    value={values.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    aria-invalid={Boolean(errors.phone)}
                    className={cn(inputClass, "rounded-l-none font-mono")}
                  />
                </div>
              </Field>

              <Field label="Email" htmlFor="lead-email" error={errors.email}>
                <input
                  id="lead-email"
                  type="email"
                  required
                  autoComplete="email"
                  maxLength={254}
                  value={values.email}
                  onChange={(e) => setField("email", e.target.value)}
                  aria-invalid={Boolean(errors.email)}
                  className={inputClass}
                />
              </Field>

              <Field label="Institution" htmlFor="lead-institution" error={errors.institutionId}>
                <InstitutionSelect
                  id="lead-institution"
                  error={errors.institutionId}
                  value={values}
                  onChange={setInstitution}
                />
              </Field>

              <Field label="Class / Grade" htmlFor="lead-grade" error={errors.grade}>
                <Select
                  id="lead-grade"
                  required
                  value={values.grade}
                  onChange={(e) => setField("grade", e.target.value)}
                  aria-invalid={Boolean(errors.grade)}
                  className={cn(!values.grade && "text-muted")}
                >
                  <option value="" disabled>
                    Pick your class or grade
                  </option>
                  {LEAD_GRADES.map((g) => (
                    <option key={g} value={g}>
                      {LEAD_GRADE_LABEL[g]}
                    </option>
                  ))}
                </Select>
              </Field>

              {/* Bot trap: hidden from people and screen readers, so only a bot fills it. */}
              <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
                <label htmlFor="lead-website">Website</label>
                <input
                  id="lead-website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={trap}
                  onChange={(e) => setTrap(e.target.value)}
                />
              </div>

              <FormError>{formError}</FormError>

              <SubmitButton pending={sending} pendingLabel="Sending">
                {fest.form.submit}
              </SubmitButton>
              <p className="text-xs text-muted">{fest.form.note}</p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
