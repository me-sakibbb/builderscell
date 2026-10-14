import { z } from "zod";
import { emailSchema, phoneSchema } from "@/lib/validation/profile";

/** Lead rules and labels shared by the landing page form and the admin pages. The
 *  database checks the same rules again in submit_lead(). */

export const LEAD_GRADES = [
  "class_6",
  "class_7",
  "class_8",
  "class_9",
  "class_10",
  "class_11",
  "class_12",
  "o_level",
  "a_level",
  "other",
] as const;
export type LeadGrade = (typeof LEAD_GRADES)[number];

export const LEAD_GRADE_LABEL: Record<LeadGrade, string> = {
  class_6: "Class 6",
  class_7: "Class 7",
  class_8: "Class 8",
  class_9: "Class 9",
  class_10: "Class 10",
  class_11: "Class 11",
  class_12: "Class 12",
  o_level: "O Level",
  a_level: "A Level",
  other: "Other",
};

export const gradeLabel = (grade: string) => LEAD_GRADE_LABEL[grade as LeadGrade] ?? grade;

export type LeadFormValues = {
  fullName: string;
  phone: string;
  email: string;
  grade: string;
  institutionId: string | null;
  institutionOther: string;
  /** Display only: the picked institution's name, so the picker can show it. */
  institutionName: string;
};

export const emptyLeadForm = (): LeadFormValues => ({
  fullName: "",
  phone: "",
  email: "",
  grade: "",
  institutionId: null,
  institutionOther: "",
  institutionName: "",
});

export const leadSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name").max(80, "That name is too long"),
    phone: phoneSchema,
    email: emailSchema.max(254, "That email is too long"),
    grade: z.enum(LEAD_GRADES, "Pick your class or grade"),
    institutionId: z.uuid().nullable().catch(null),
    institutionOther: z.string().trim().max(120, "That name is too long").default(""),
  })
  .refine((v) => Boolean(v.institutionId) || v.institutionOther.length >= 2, {
    message: "Pick your institution, or type it in",
    path: ["institutionId"],
  })
  // A picked institution wins; the typed name is only kept when nothing was picked.
  .transform((v) => ({ ...v, institutionOther: v.institutionId ? "" : v.institutionOther }));

export type LeadPayload = z.output<typeof leadSchema>;

/** Contacted filter on the admin list. */
export const LEAD_CONTACTED = ["no", "yes"] as const;
export type LeadContacted = (typeof LEAD_CONTACTED)[number];

export const LEAD_CONTACTED_LABEL: Record<LeadContacted, string> = {
  no: "Not contacted",
  yes: "Contacted",
};

export const leadDateTime = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Dhaka",
});

/** Postgres raises these as bare codes. */
const LEAD_ERROR: Record<string, string> = {
  lead_event_closed: "We are no longer taking sign-ups for this event.",
  invalid_lead: "Some of these details do not look right. Check them and try again.",
  lead_not_found: "That lead no longer exists.",
  not_authorised: "You do not have access to this.",
};

export function leadErrorMessage(raw: string | null | undefined, fallback = "Could not save your details. Try again in a moment.") {
  return LEAD_ERROR[(raw ?? "").trim()] ?? fallback;
}
