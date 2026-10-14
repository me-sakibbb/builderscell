"use client";

import { useState } from "react";
import { Loader2, Lock, UserCheck } from "lucide-react";
import { InstitutionSelect } from "@/components/auth/institution-select";
import { YesNo } from "@/components/registration/choice";
import { Field, FormError, inputClass } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { CONSENTS, classOptions, type ConsentKey, type DraftMember } from "@/lib/validation/registration";
import type { RegistrationWizard } from "@/hooks/use-registration-wizard";
import { cn } from "@/lib/cn";

type Props = {
  wizard: RegistrationWizard;
  index: number;
  minClassLevel: number | null;
  maxClassLevel: number | null;
};

/** A value that came from the participant's own profile and cannot be edited here. */
function LockedValue({ value }: { value: string }) {
  return (
    <div className={cn(inputClass, "flex items-center gap-3 py-0 opacity-90")}>
      <Lock aria-hidden className="size-4 shrink-0 text-muted" />
      <span className="min-w-0 truncate">{value || "—"}</span>
    </div>
  );
}

export function MemberStep({ wizard, index, minClassLevel, maxClassLevel }: Props) {
  const member = wizard.draft.members[index];
  const isLead = index === 0;
  const [lookupEmail, setLookupEmail] = useState("");

  const err = (field: string) => wizard.errors[`members.${index}.${field}`];
  const isLocked = (field: keyof DraftMember) => member.locked.includes(field as string);
  const set = (patch: Partial<DraftMember>) => wizard.updateMember(index, patch);

  const today = new Date().toISOString().slice(0, 10);
  const classes = classOptions(minClassLevel, maxClassLevel);
  const linked = Boolean(member.linkedUserId);

  return (
    <div className="space-y-6">
      <header>
        <p className="label text-muted">
          {isLead ? "Participant 1" : `Participant ${index + 1}`}
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          {isLead ? "Your details" : `Member ${String(index + 1).padStart(2, "0")} details`}
        </h2>
        <p className="mt-2 text-muted">
          {isLead
            ? "Pre-filled from your profile. Correct anything that has changed."
            : "Add this member by their Builders' Cell email, or type their details in."}
        </p>
      </header>

      {!isLead && (
        <div className="rounded-2xl hairline bg-surface/60 p-4">
          {linked ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-sm text-fg">
                <UserCheck aria-hidden className="size-4 text-accent-ink" />
                <span>
                  Added from <span className="font-medium">{member.email}</span>. Their own details are locked.
                </span>
              </p>
              <button
                type="button"
                onClick={() => {
                  wizard.unlinkMember(index);
                  setLookupEmail("");
                }}
                className="text-sm text-muted underline-offset-4 transition-colors hover:text-fg hover:underline"
              >
                Type the details in instead
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <label htmlFor={`lookup-${index}`} className="block text-sm font-medium text-fg">
                Already a Builders&apos; Cell member?
              </label>
              <div className="flex flex-wrap items-stretch gap-2">
                <input
                  id={`lookup-${index}`}
                  type="email"
                  inputMode="email"
                  autoComplete="off"
                  value={lookupEmail}
                  onChange={(e) => setLookupEmail(e.target.value)}
                  placeholder="Their account email address"
                  className={cn(inputClass, "min-w-0 flex-1")}
                />
                <button
                  type="button"
                  disabled={wizard.lookupBusy[index] || lookupEmail.trim().length < 3}
                  onClick={() => void wizard.linkMember(index, lookupEmail)}
                  className="inline-flex h-12 shrink-0 items-center gap-2 rounded-xl bg-fg px-5 text-sm font-medium text-bg transition-colors hover:bg-accent hover:text-accent-fg disabled:opacity-60"
                >
                  {wizard.lookupBusy[index] && <Loader2 aria-hidden className="size-4 animate-spin" />}
                  {wizard.lookupBusy[index] ? "Looking…" : "Find member"}
                </button>
              </div>
              {wizard.lookupErrors[index] ? (
                <p role="alert" className="text-sm text-signal">
                  {wizard.lookupErrors[index]}
                </p>
              ) : (
                <p className="text-sm text-muted">
                  We match on the exact email they signed up with. Otherwise just fill the form below.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="space-y-5">
        <Field label="Full name" htmlFor={`fullName-${index}`} error={err("fullName")}>
          {isLocked("fullName") ? (
            <LockedValue value={member.fullName} />
          ) : (
            <input
              id={`fullName-${index}`}
              type="text"
              maxLength={80}
              autoComplete={isLead ? "name" : "off"}
              value={member.fullName}
              onChange={(e) => set({ fullName: e.target.value })}
              placeholder="As it should appear on the certificate"
              aria-invalid={Boolean(err("fullName"))}
              className={inputClass}
            />
          )}
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Phone number"
            htmlFor={`phone-${index}`}
            error={err("phone")}
            hint="WhatsApp available"
          >
            {isLocked("phone") ? (
              <LockedValue value={member.phone ? `+880 ${member.phone}` : ""} />
            ) : (
              <div className="flex items-stretch">
                <span className="flex items-center rounded-l-xl border border-r-0 border-line bg-bg-elev px-3 font-mono text-sm text-muted">
                  +880
                </span>
                <input
                  id={`phone-${index}`}
                  type="tel"
                  inputMode="numeric"
                  autoComplete="off"
                  value={member.phone}
                  onChange={(e) => set({ phone: e.target.value })}
                  placeholder="1712 345678"
                  aria-invalid={Boolean(err("phone"))}
                  className={cn(inputClass, "rounded-l-none font-mono")}
                />
              </div>
            )}
          </Field>

          <Field label="Email address" htmlFor={`email-${index}`} error={err("email")}>
            {isLocked("email") ? (
              <LockedValue value={member.email} />
            ) : (
              <input
                id={`email-${index}`}
                type="email"
                inputMode="email"
                autoComplete="off"
                maxLength={160}
                value={member.email}
                onChange={(e) => set({ email: e.target.value })}
                placeholder="name@example.com"
                aria-invalid={Boolean(err("email"))}
                className={inputClass}
              />
            )}
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Date of birth" htmlFor={`dob-${index}`} error={err("dob")}>
            {isLocked("dob") ? (
              <LockedValue value={member.dob} />
            ) : (
              <input
                id={`dob-${index}`}
                type="date"
                max={today}
                min="1900-01-01"
                value={member.dob}
                onChange={(e) => set({ dob: e.target.value })}
                aria-invalid={Boolean(err("dob"))}
                className={cn(inputClass, "font-mono")}
              />
            )}
          </Field>

          <Field label="Class / grade" htmlFor={`class-${index}`} error={err("classLevel")}>
            {isLocked("classLevel") ? (
              <LockedValue value={member.classLevel ? `Class ${member.classLevel}` : ""} />
            ) : (
              <Select
                id={`class-${index}`}
                value={member.classLevel}
                onChange={(e) => set({ classLevel: e.target.value })}
                aria-invalid={Boolean(err("classLevel"))}
              >
                <option value="">Select a class</option>
                {classes.map((level) => (
                  <option key={level} value={String(level)}>
                    Class {level}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>

        <Field label="Institution" htmlFor={`institution-${index}`} error={err("institutionId")}>
          <InstitutionSelect
            id={`institution-${index}`}
            error={err("institutionId")}
            locked={isLocked("institutionId")}
            value={{
              institutionId: member.institutionId,
              institutionOther: member.institutionOther,
              institutionName: member.institutionName,
            }}
            onChange={(value) => set(value)}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Section" htmlFor={`section-${index}`} error={err("section")}>
            {isLocked("section") ? (
              <LockedValue value={member.section} />
            ) : (
              <input
                id={`section-${index}`}
                type="text"
                maxLength={40}
                value={member.section}
                onChange={(e) => set({ section: e.target.value })}
                aria-invalid={Boolean(err("section"))}
                className={inputClass}
              />
            )}
          </Field>

          <Field label="Roll number / student ID" htmlFor={`roll-${index}`} error={err("roll")}>
            {isLocked("roll") ? (
              <LockedValue value={member.roll} />
            ) : (
              <input
                id={`roll-${index}`}
                type="text"
                maxLength={40}
                value={member.roll}
                onChange={(e) => set({ roll: e.target.value })}
                aria-invalid={Boolean(err("roll"))}
                className={inputClass}
              />
            )}
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Guardian's full name" htmlFor={`guardianName-${index}`} error={err("guardianName")}>
            {isLocked("guardianName") ? (
              <LockedValue value={member.guardianName} />
            ) : (
              <input
                id={`guardianName-${index}`}
                type="text"
                maxLength={80}
                value={member.guardianName}
                onChange={(e) => set({ guardianName: e.target.value })}
                aria-invalid={Boolean(err("guardianName"))}
                className={inputClass}
              />
            )}
          </Field>

          <Field label="Guardian's phone number" htmlFor={`guardianPhone-${index}`} error={err("guardianPhone")}>
            {isLocked("guardianPhone") ? (
              <LockedValue value={member.guardianPhone ? `+880 ${member.guardianPhone}` : ""} />
            ) : (
              <div className="flex items-stretch">
                <span className="flex items-center rounded-l-xl border border-r-0 border-line bg-bg-elev px-3 font-mono text-sm text-muted">
                  +880
                </span>
                <input
                  id={`guardianPhone-${index}`}
                  type="tel"
                  inputMode="numeric"
                  value={member.guardianPhone}
                  onChange={(e) => set({ guardianPhone: e.target.value })}
                  placeholder="1712 345678"
                  aria-invalid={Boolean(err("guardianPhone"))}
                  className={cn(inputClass, "rounded-l-none font-mono")}
                />
              </div>
            )}
          </Field>
        </div>

        <Field label="Present address" htmlFor={`address-${index}`} error={err("address")}>
          {isLocked("address") ? (
            <LockedValue value={member.address} />
          ) : (
            <textarea
              id={`address-${index}`}
              rows={3}
              maxLength={300}
              value={member.address}
              onChange={(e) => set({ address: e.target.value })}
              aria-invalid={Boolean(err("address"))}
              className={cn(inputClass, "h-auto py-3 leading-relaxed")}
            />
          )}
        </Field>
      </div>

      <div className="space-y-3">
        <h3 className="label text-muted">Guardian agreements</h3>
        {CONSENTS.map((consent) => (
          <YesNo
            key={consent.key}
            id={`${consent.key}-${index}`}
            label={consent.label}
            value={member[consent.key as ConsentKey] as boolean | null}
            error={err(consent.key)}
            onChange={(value) => set({ [consent.key]: value } as Partial<DraftMember>)}
          />
        ))}
      </div>

      <FormError>{wizard.errors[`members.${index}.form`]}</FormError>
    </div>
  );
}
