import { z } from "zod";
import { dobSchema, emailSchema, phoneSchema } from "@/lib/validation/profile";

/** Everything the registration wizard validates, plus the labels both it and the review pages read. */

export const REGISTRATION_TYPES = ["individual", "team"] as const;
export type RegistrationType = (typeof REGISTRATION_TYPES)[number];

export const PAYMENT_METHODS = ["bkash", "nagad"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  bkash: "bKash",
  nagad: "Nagad",
};

export const HEARD_FROM_OPTIONS = [
  { value: "friends", label: "Friends" },
  { value: "open_session", label: "Open session" },
  { value: "leaflet", label: "Leaflet" },
  { value: "social_media", label: "Social media" },
  { value: "school_notice", label: "School notice" },
  { value: "other", label: "Other" },
] as const;

export const HEARD_FROM_VALUES = HEARD_FROM_OPTIONS.map((o) => o.value) as unknown as [string, ...string[]];

export const HEARD_FROM_LABEL: Record<string, string> = Object.fromEntries(
  HEARD_FROM_OPTIONS.map((o) => [o.value, o.label]),
);

export const REGISTRATION_STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  pending: "Pending review",
  approved: "Approved",
  rejected: "Not accepted",
};

/** The three agreements, worded as the guardian has to read them. All are required. */
export const CONSENTS = [
  {
    key: "consentGuardian",
    label:
      "I confirm that I am the parent/legal guardian of the student named in this registration form and give my consent for them to participate in the robotics workshop.",
  },
  {
    key: "consentMedia",
    label:
      "I give permission for photographs and videos of the student taken during the workshop to be used by the organizers for educational, documentation, and promotional purposes.",
  },
  {
    key: "consentSafety",
    label:
      "I understand that the workshop involves hands-on robotics activities and the use of electronic components, tools, machinery, and other equipment. I agree that the student will follow all safety instructions, workshop rules, and directions given by the instructors and organizers.",
  },
] as const;

export type ConsentKey = (typeof CONSENTS)[number]["key"];

const consentSchema = (what: string) =>
  z.boolean().refine((v) => v === true, `Registration needs this ${what} agreement`);

export const memberSchema = z
  .object({
    linkedUserId: z.uuid().nullable().catch(null),
    fullName: z.string().trim().min(2, "Enter the full name").max(80, "That name is too long"),
    email: emailSchema,
    phone: phoneSchema,
    dob: dobSchema,
    institutionId: z.uuid().nullable().catch(null),
    institutionOther: z.string().trim().max(120, "That name is too long").default(""),
    classLevel: z.coerce
      .number("Pick a class")
      .int("Pick a class")
      .min(1, "Pick a class")
      .max(12, "Pick a class"),
    section: z.string().trim().min(1, "Enter the section").max(40, "That section is too long"),
    roll: z.string().trim().min(1, "Enter the roll number").max(40, "That roll number is too long"),
    guardianName: z.string().trim().min(2, "Enter the guardian's full name").max(80, "That name is too long"),
    guardianPhone: phoneSchema,
    address: z.string().trim().min(5, "Enter the present address").max(300, "That address is too long"),
    consentGuardian: consentSchema("guardian"),
    consentMedia: consentSchema("media"),
    consentSafety: consentSchema("safety"),
  })
  .refine((v) => Boolean(v.institutionId) || v.institutionOther.length >= 2, {
    message: "Pick the institution, or type it in",
    path: ["institutionId"],
  });

export type MemberValues = z.output<typeof memberSchema>;

export const submissionSchema = z
  .object({
    type: z.enum(REGISTRATION_TYPES, "Pick how you are registering"),
    members: z.array(memberSchema).min(1, "Add at least one participant").max(10),
    payment: z.object({
      method: z.enum(PAYMENT_METHODS, "Pick the payment method you used"),
      transactionId: z
        .string()
        .trim()
        .min(4, "Enter the transaction ID from your payment")
        .max(80, "That transaction ID is too long"),
    }),
    heardFrom: z.enum(HEARD_FROM_VALUES).nullable().catch(null),
    heardFromOther: z.string().trim().max(120, "Keep this under 120 characters").default(""),
  })
  .refine((v) => v.type !== "individual" || v.members.length === 1, {
    message: "An individual registration takes one participant",
    path: ["members"],
  })
  .refine((v) => v.type !== "team" || v.members.length >= 2, {
    message: "A team needs at least two participants",
    path: ["members"],
  })
  .refine((v) => v.heardFrom !== "other" || v.heardFromOther.length >= 2, {
    message: "Tell us where you heard about us",
    path: ["heardFromOther"],
  });

export type SubmissionValues = z.output<typeof submissionSchema>;

/** Loose shape for the autosaved draft: half-filled is the normal state here.
 *  The shape is declared on its own and `DraftMember` is read off it, so that the
 *  `.catch(() => emptyMember())` fallback below does not make the type self-referential. */
const draftMemberShape = z
  .object({
    linkedUserId: z.string().nullable().catch(null),
    locked: z.array(z.string()).max(20).catch([]),
    fullName: z.string().max(120).catch(""),
    email: z.string().max(160).catch(""),
    phone: z.string().max(40).catch(""),
    dob: z.string().max(10).catch(""),
    institutionId: z.string().nullable().catch(null),
    institutionOther: z.string().max(160).catch(""),
    institutionName: z.string().max(200).catch(""),
    classLevel: z.string().max(2).catch(""),
    section: z.string().max(60).catch(""),
    roll: z.string().max(60).catch(""),
    guardianName: z.string().max(120).catch(""),
    guardianPhone: z.string().max(40).catch(""),
    address: z.string().max(400).catch(""),
    consentGuardian: z.boolean().nullable().catch(null),
    consentMedia: z.boolean().nullable().catch(null),
    consentSafety: z.boolean().nullable().catch(null),
  });

export type DraftMember = z.output<typeof draftMemberShape>;

const draftMemberSchema = draftMemberShape.catch(() => emptyMember());

export const draftSchema = z.object({
  type: z.enum(REGISTRATION_TYPES).nullable().catch(null),
  memberCount: z.number().int().min(1).max(10).catch(1),
  members: z.array(draftMemberSchema).max(10).catch([]),
  payment: z
    .object({
      method: z.enum(PAYMENT_METHODS).nullable().catch(null),
      transactionId: z.string().max(80).catch(""),
    })
    .catch({ method: null, transactionId: "" }),
  heardFrom: z.enum(HEARD_FROM_VALUES).nullable().catch(null),
  heardFromOther: z.string().max(160).catch(""),
});

export type DraftValues = z.output<typeof draftSchema>;

export function emptyMember(): DraftMember {
  return {
    linkedUserId: null,
    locked: [],
    fullName: "",
    email: "",
    phone: "",
    dob: "",
    institutionId: null,
    institutionOther: "",
    institutionName: "",
    classLevel: "",
    section: "",
    roll: "",
    guardianName: "",
    guardianPhone: "",
    address: "",
    consentGuardian: null,
    consentMedia: null,
    consentSafety: null,
  };
}

export function emptyDraft(): DraftValues {
  return {
    type: null,
    memberCount: 1,
    members: [emptyMember()],
    payment: { method: null, transactionId: "" },
    heardFrom: null,
    heardFromOther: "",
  };
}

/** Parses whatever came back from the `draft` jsonb column into a usable wizard state. */
export function parseDraft(value: unknown): DraftValues {
  const parsed = draftSchema.safeParse(value ?? {});
  const draft = parsed.success ? parsed.data : emptyDraft();
  const members = draft.members.length ? draft.members : [emptyMember()];
  return { ...draft, members };
}

/** Postgres raises these as bare codes; this is where they become something readable. */
const SUBMIT_ERROR: Record<string, string> = {
  not_authenticated: "Your session expired. Sign in again and your draft will still be here.",
  not_authorised: "You do not have access to this.",
  registration_not_found: "We could not find this draft. Start again from the campaign page.",
  already_submitted: "This registration has already been submitted.",
  campaign_not_found: "This campaign is no longer available.",
  registration_closed: "Registration for this campaign has closed.",
  registration_not_open: "Registration for this campaign has not opened yet.",
  invalid_type: "That way of registering is not offered for this campaign.",
  invalid_member_count: "The number of participants does not match this campaign's rules.",
  invalid_payment_method: "Pick bKash or Nagad.",
  invalid_transaction_id: "Enter the transaction ID from your payment.",
  invalid_heard_from: "Pick one of the listed answers.",
  invalid_class: "Pick a class for every participant.",
  class_out_of_range: "A participant's class is outside what this campaign accepts.",
  transaction_id_taken: "That transaction ID is already on another registration. Check the ID and try again.",
  campaign_full: "The last seats were taken while you were filling this in.",
  member_already_registered: "A participant is already on a registration for this campaign.",
  duplicate_member_in_team: "Two participants share an email address or phone number.",
  linked_member_not_found: "That member's account could not be loaded. Remove them and type the details in.",
  invalid_payload: "Something in the form did not come through. Refresh and try again.",
};

export function submitErrorMessage(raw: string | undefined): string {
  const key = (raw ?? "").trim();
  return SUBMIT_ERROR[key] ?? "Could not submit this registration. Try again in a moment.";
}

/** Forms show the national part next to a +880 prefix; the database stores +8801XXXXXXXXX. */
export function toNationalPhone(value: string | null | undefined): string {
  return (value ?? "").replace(/^\+?880/, "").trim();
}

/** Class options a campaign accepts, e.g. 6 to 12. */
export function classOptions(min: number | null, max: number | null): number[] {
  const from = Math.max(1, min ?? 1);
  const to = Math.min(12, max ?? 12);
  return Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i);
}
