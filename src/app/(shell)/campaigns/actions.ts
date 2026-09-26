"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/queries/profile";
import { lookupMemberByEmail, saveDraft, submitRegistration } from "@/lib/queries/registrations";
import { getCampaignBySlug, registrationWindow } from "@/lib/queries/campaigns";
import { emailSchema } from "@/lib/validation/profile";
import {
  draftSchema,
  submissionSchema,
  submitErrorMessage,
  toNationalPhone,
  type DraftValues,
} from "@/lib/validation/registration";

export type SaveDraftResult = { id: string | null; error: string | null };

export type SubmitResult = {
  ok?: boolean;
  error?: string;
  /** Keyed by the field's path, e.g. `members.1.guardianPhone`. */
  fieldErrors?: Record<string, string>;
};

export type MemberLookupResult = {
  member?: {
    userId: string;
    fullName: string;
    email: string;
    phone: string;
    dob: string;
    institutionId: string | null;
    institutionOther: string;
    institutionName: string;
    classLevel: string;
    section: string;
    roll: string;
    guardianName: string;
    guardianPhone: string;
    address: string;
    /** Fields the team lead may not edit, because they come from that member's own profile. */
    locked: string[];
  };
  error?: string;
};

/** Autosave. Creates the draft row the first time it is called. */
export async function saveDraftAction(input: {
  campaignSlug: string;
  registrationId: string | null;
  draft: unknown;
  step: number;
}): Promise<SaveDraftResult> {
  const user = await getCurrentUser();
  if (!user) return { id: null, error: "Your session expired. Sign in again." };

  const campaign = await getCampaignBySlug(input.campaignSlug);
  if (!campaign) return { id: null, error: "This campaign is no longer available." };

  const window = registrationWindow(campaign);
  if (!window.open) return { id: null, error: window.reason ?? "Registration is closed." };

  const parsed = draftSchema.safeParse(input.draft);
  if (!parsed.success) return { id: null, error: "Could not save this draft." };

  const step = Number.isFinite(input.step) ? Math.min(Math.max(Math.trunc(input.step), 0), 12) : 0;

  return saveDraft({
    userId: user.id,
    campaignId: campaign.id,
    registrationId: input.registrationId,
    draft: parsed.data as DraftValues,
    step,
  });
}

/** Exact-email lookup used to pull a team mate's own details onto the form. */
export async function lookupMemberAction(email: string): Promise<MemberLookupResult> {
  const user = await getCurrentUser();
  if (!user) return { error: "Your session expired. Sign in again." };

  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { member, error } = await lookupMemberByEmail(parsed.data);
  if (error) return { error: "Could not look that member up. Try again in a moment." };
  if (!member) return { error: "No Builder'sCell member uses that email address." };
  if (member.user_id === user.id) return { error: "That is your own account: you are already participant 1." };

  const locked = (
    [
      ["fullName", member.full_name],
      ["email", member.email],
      ["phone", member.phone],
      ["dob", member.dob],
      ["institutionId", member.institution_id ?? member.institution_other],
      ["classLevel", member.class_level],
      ["section", member.section],
      ["roll", member.roll],
      ["guardianName", member.guardian_name],
      ["guardianPhone", member.guardian_phone],
      ["address", member.address],
    ] as const
  )
    .filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== "")
    .map(([key]) => key);

  return {
    member: {
      userId: member.user_id,
      fullName: member.full_name ?? "",
      email: member.email ?? "",
      phone: toNationalPhone(member.phone),
      dob: member.dob ?? "",
      institutionId: member.institution_id ?? null,
      institutionOther: member.institution_other ?? "",
      institutionName: member.institution_name ?? "",
      classLevel: member.class_level ? String(member.class_level) : "",
      section: member.section ?? "",
      roll: member.roll ?? "",
      guardianName: member.guardian_name ?? "",
      guardianPhone: toNationalPhone(member.guardian_phone),
      address: member.address ?? "",
      locked,
    },
  };
}

/** Validates the finished wizard and hands it to the database. */
export async function submitRegistrationAction(input: {
  campaignSlug: string;
  registrationId: string | null;
  draft: unknown;
}): Promise<SubmitResult> {
  const user = await getCurrentUser();
  if (!user) return { error: "Your session expired. Sign in again and your draft will still be here." };

  const campaign = await getCampaignBySlug(input.campaignSlug);
  if (!campaign) return { error: "This campaign is no longer available." };

  const window = registrationWindow(campaign);
  if (!window.open) return { error: window.reason ?? "Registration is closed." };

  const draftParsed = draftSchema.safeParse(input.draft);
  if (!draftParsed.success) return { error: "Something in the form did not come through. Refresh and try again." };
  const draft = draftParsed.data;

  const members = draft.members.slice(0, draft.type === "individual" ? 1 : draft.memberCount);

  const parsed = submissionSchema.safeParse({
    type: draft.type,
    members: members.map((m) => ({
      linkedUserId: m.linkedUserId,
      fullName: m.fullName,
      email: m.email,
      phone: m.phone,
      dob: m.dob,
      institutionId: m.institutionId,
      institutionOther: m.institutionOther,
      classLevel: m.classLevel,
      section: m.section,
      roll: m.roll,
      guardianName: m.guardianName,
      guardianPhone: m.guardianPhone,
      address: m.address,
      consentGuardian: m.consentGuardian === true,
      consentMedia: m.consentMedia === true,
      consentSafety: m.consentSafety === true,
    })),
    payment: { method: draft.payment.method, transactionId: draft.payment.transactionId },
    heardFrom: draft.heardFrom,
    heardFromOther: draft.heardFromOther,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "form";
      fieldErrors[key] ??= issue.message;
    }
    return { fieldErrors };
  }

  // No draft row yet means nothing was ever autosaved; create one now so the id exists.
  let registrationId = input.registrationId;
  if (!registrationId) {
    const saved = await saveDraft({
      userId: user.id,
      campaignId: campaign.id,
      registrationId: null,
      draft,
      step: draft.memberCount + 2,
    });
    if (!saved.id) return { error: "Could not save this registration. Try again in a moment." };
    registrationId = saved.id;
  }

  const { error } = await submitRegistration(registrationId, parsed.data);
  if (error) return { error: submitErrorMessage(error) };

  revalidatePath(`/campaigns/${campaign.slug}/register`);
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}
