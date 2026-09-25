import { z } from "zod";

export const INSTITUTION_TYPE_LABEL: Record<string, string> = {
  university: "University",
  college: "College",
  school_and_college: "School & College",
  school: "School",
  madrasa: "Madrasa",
  technical: "Technical",
};

export const emailSchema = z.email("Enter a valid email address").trim().toLowerCase();

export const otpSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Enter the 6-digit code from your email");

/** Accepts 01XXXXXXXXX, 8801XXXXXXXXX or +8801XXXXXXXXX and stores +8801XXXXXXXXX. */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/[^\d]/g, "");
  const local = digits.startsWith("880") ? digits.slice(3) : digits.startsWith("0") ? digits : `0${digits}`;
  return /^01[3-9]\d{8}$/.test(local) ? `+88${local}` : null;
}

export const phoneSchema = z
  .string()
  .trim()
  .transform((v, ctx) => {
    const normalized = normalizePhone(v);
    if (!normalized) {
      ctx.addIssue({ code: "custom", message: "Enter a Bangladeshi mobile number, e.g. 01712 345678" });
      return z.NEVER;
    }
    return normalized;
  });

const MIN_DOB = "1900-01-01";

export const dobSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter your date of birth")
  .refine((v) => !Number.isNaN(Date.parse(v)), "Enter a real date")
  .refine((v) => v >= MIN_DOB, "That date is too far in the past")
  .refine((v) => v <= new Date().toISOString().slice(0, 10), "Date of birth cannot be in the future");

export const onboardingSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name").max(80, "That name is too long"),
    institutionId: z.uuid().nullable().catch(null),
    institutionOther: z.string().trim().max(120, "That name is too long").default(""),
    dob: dobSchema,
    phone: phoneSchema,
  })
  .refine((v) => Boolean(v.institutionId) || v.institutionOther.length >= 2, {
    message: "Pick your institution, or type it in",
    path: ["institutionId"],
  });

export type OnboardingInput = z.input<typeof onboardingSchema>;
export type OnboardingValues = z.output<typeof onboardingSchema>;
