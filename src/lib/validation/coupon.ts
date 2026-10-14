import { z } from "zod";
import { bdt } from "@/content/site";

/** Coupon rules, labels and formatting shared by the admin pages and the payment step.
 *  Prices themselves are always decided in Postgres; nothing here computes what a
 *  member pays. */

export const DISCOUNT_TYPES = ["percent", "amount_off", "fixed_price"] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

export const DISCOUNT_TYPE_LABEL: Record<DiscountType, string> = {
  percent: "Percentage off",
  amount_off: "Amount off",
  fixed_price: "Fixed price",
};

export const DISCOUNT_TYPE_HINT: Record<DiscountType, string> = {
  percent: "Take a share of the fee off, with an optional ceiling.",
  amount_off: "Take a set amount off the fee.",
  fixed_price: "Replace the fee with a set price.",
};

export const COUPON_CODE_PATTERN = /^[A-Z0-9][A-Z0-9_-]{2,31}$/;

/** Schedules are entered and shown in Bangladesh time, whatever the server's own zone.
 *  Bangladesh keeps no daylight saving, so the offset is fixed. */
export const COUPON_TIME_ZONE = "Asia/Dhaka";
const OFFSET = "+06:00";
const OFFSET_MS = 6 * 60 * 60 * 1000;

/** `2026-10-15T09:30` typed into a datetime-local input, read as Dhaka time. */
export function fromLocalInput(value: string): string | null {
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)) return null;
  const date = new Date(`${trimmed}:00${OFFSET}`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/** The reverse: a stored timestamp as a datetime-local value in Dhaka time. */
export function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() + OFFSET_MS).toISOString().slice(0, 16);
}

export const couponDateTime = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: COUPON_TIME_ZONE,
});

/** Random, readable code: no 0/O or 1/I to misread over the phone. */
export function randomCouponCode(length = 8) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (n) => alphabet[n % alphabet.length]).join("");
}

/** The admin form as typed: numbers stay strings until they are parsed. */
export type CouponFormValues = {
  code: string;
  label: string;
  discountType: DiscountType;
  percentOff: string;
  maxDiscount: string;
  individualValue: string;
  teamValue: string;
  appliesToIndividual: boolean;
  appliesToTeam: boolean;
  allCampaigns: boolean;
  campaignIds: string[];
  isActive: boolean;
  startsAt: string;
  endsAt: string;
  maxRedemptions: string;
  displayEnabled: boolean;
  displayMessage: string;
  displayShowCode: boolean;
};

export const DISPLAY_MESSAGE_MAX = 140;

export function emptyCouponForm(): CouponFormValues {
  return {
    code: "",
    label: "",
    discountType: "percent",
    percentOff: "",
    maxDiscount: "",
    individualValue: "",
    teamValue: "",
    appliesToIndividual: true,
    appliesToTeam: true,
    allCampaigns: false,
    campaignIds: [],
    isActive: false,
    startsAt: "",
    endsAt: "",
    maxRedemptions: "",
    displayEnabled: false,
    displayMessage: "",
    displayShowCode: false,
  };
}

/** A stored coupon, back into the shape the editor works with. */
export function couponFormFromRow(
  row: CouponShape & {
    code: string;
    label: string | null;
    all_campaigns: boolean;
    display_enabled: boolean;
    display_message: string | null;
    display_show_code: boolean;
  },
  campaignIds: string[],
): CouponFormValues {
  const num = (value: number | null) => (value === null ? "" : String(value));

  return {
    code: row.code,
    label: row.label ?? "",
    discountType: (DISCOUNT_TYPES as readonly string[]).includes(row.discount_type)
      ? (row.discount_type as DiscountType)
      : "percent",
    percentOff: num(row.percent_off),
    maxDiscount: num(row.max_discount_bdt),
    individualValue: num(row.individual_value_bdt),
    teamValue: num(row.team_value_bdt),
    appliesToIndividual: row.applies_to_individual,
    appliesToTeam: row.applies_to_team,
    allCampaigns: row.all_campaigns,
    campaignIds,
    isActive: row.is_active,
    startsAt: toLocalInput(row.starts_at),
    endsAt: toLocalInput(row.ends_at),
    maxRedemptions: num(row.max_redemptions),
    displayEnabled: row.display_enabled,
    displayMessage: row.display_message ?? "",
    displayShowCode: row.display_show_code,
  };
}

const wholeNumber = (value: string) => (/^\d+$/.test(value.trim()) ? Number(value.trim()) : NaN);

/** Validates the admin form and turns it into the payload admin_save_coupon() reads.
 *  Values that do not apply to the chosen discount type are sent as null. */
export const couponSchema = z
  .object({
    code: z.string(),
    label: z.string(),
    discountType: z.enum(DISCOUNT_TYPES, "Pick a discount type"),
    percentOff: z.string(),
    maxDiscount: z.string(),
    individualValue: z.string(),
    teamValue: z.string(),
    appliesToIndividual: z.boolean(),
    appliesToTeam: z.boolean(),
    allCampaigns: z.boolean(),
    campaignIds: z.array(z.uuid()).max(200),
    isActive: z.boolean(),
    startsAt: z.string(),
    endsAt: z.string(),
    maxRedemptions: z.string(),
    displayEnabled: z.boolean(),
    displayMessage: z.string(),
    displayShowCode: z.boolean(),
  })
  .transform((v, ctx) => {
    const issue = (path: string, message: string) => ctx.addIssue({ code: "custom", path: [path], message });

    const code = v.code.trim().toUpperCase();
    if (!COUPON_CODE_PATTERN.test(code)) {
      issue("code", "Use 3 to 32 letters, numbers, dashes or underscores");
    }

    const label = v.label.trim();
    if (label.length > 120) issue("label", "Keep the note under 120 characters");

    if (!v.appliesToIndividual && !v.appliesToTeam) {
      issue("appliesTo", "Pick individual, team or both");
    }
    if (!v.allCampaigns && v.campaignIds.length === 0) {
      issue("campaignIds", "Pick at least one campaign, or apply it to every campaign");
    }

    let percentOff: number | null = null;
    let maxDiscount: number | null = null;
    let individualValue: number | null = null;
    let teamValue: number | null = null;

    if (v.discountType === "percent") {
      percentOff = wholeNumber(v.percentOff);
      if (!(percentOff >= 1 && percentOff <= 100)) issue("percentOff", "Enter a whole number from 1 to 100");

      if (v.maxDiscount.trim()) {
        maxDiscount = wholeNumber(v.maxDiscount);
        if (!(maxDiscount >= 1)) issue("maxDiscount", "Enter a whole amount in BDT, or leave it empty");
      }
    } else {
      const min = v.discountType === "amount_off" ? 1 : 0;
      const message =
        v.discountType === "amount_off" ? "Enter the BDT taken off, at least 1" : "Enter the price in BDT, 0 or more";

      if (v.appliesToIndividual) {
        individualValue = wholeNumber(v.individualValue);
        if (!(individualValue >= min)) issue("individualValue", message);
      }
      if (v.appliesToTeam) {
        teamValue = wholeNumber(v.teamValue);
        if (!(teamValue >= min)) issue("teamValue", message);
      }
    }

    const startsAt = v.startsAt.trim() ? fromLocalInput(v.startsAt) : null;
    const endsAt = v.endsAt.trim() ? fromLocalInput(v.endsAt) : null;
    if (v.startsAt.trim() && !startsAt) issue("startsAt", "Enter a valid date and time");
    if (v.endsAt.trim() && !endsAt) issue("endsAt", "Enter a valid date and time");
    if (startsAt && endsAt && endsAt <= startsAt) issue("endsAt", "The end has to come after the start");

    let maxRedemptions: number | null = null;
    if (v.maxRedemptions.trim()) {
      maxRedemptions = wholeNumber(v.maxRedemptions);
      if (!(maxRedemptions >= 1)) issue("maxRedemptions", "Enter a whole number, or leave it empty for no cap");
    }

    // The message is kept when display is off, so switching it back on restores it.
    const displayMessage = v.displayMessage.trim();
    if (displayMessage.length > DISPLAY_MESSAGE_MAX) {
      issue("displayMessage", `Keep the message under ${DISPLAY_MESSAGE_MAX} characters`);
    } else if (v.displayEnabled && displayMessage.length < 2) {
      issue("displayMessage", "Say who this offer is for, e.g. Students of partner schools");
    } else if (displayMessage.length === 1) {
      issue("displayMessage", "Write at least 2 characters, or leave it empty");
    }

    return {
      code,
      label,
      discountType: v.discountType,
      percentOff,
      maxDiscount,
      individualValue,
      teamValue,
      appliesToIndividual: v.appliesToIndividual,
      appliesToTeam: v.appliesToTeam,
      allCampaigns: v.allCampaigns,
      campaignIds: v.allCampaigns ? [] : v.campaignIds,
      isActive: v.isActive,
      startsAt,
      endsAt,
      maxRedemptions,
      displayEnabled: v.displayEnabled,
      displayMessage,
      displayShowCode: v.displayShowCode,
    };
  });

export type CouponPayload = z.output<typeof couponSchema>;

/** The columns a coupon's summary and state are read from. */
export type CouponShape = {
  discount_type: string;
  percent_off: number | null;
  max_discount_bdt: number | null;
  individual_value_bdt: number | null;
  team_value_bdt: number | null;
  applies_to_individual: boolean;
  applies_to_team: boolean;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  max_redemptions: number | null;
};

/** One line saying what a coupon does, e.g. "20% off, up to ৳800". */
export function describeDiscount(coupon: CouponShape): string {
  if (coupon.discount_type === "percent") {
    const cap = coupon.max_discount_bdt ? `, up to ${bdt(coupon.max_discount_bdt)}` : "";
    return `${coupon.percent_off ?? 0}% off${cap}`;
  }

  const verb = coupon.discount_type === "amount_off" ? (n: number) => `${bdt(n)} off` : (n: number) => `Pay ${bdt(n)}`;
  const parts: string[] = [];
  if (coupon.applies_to_individual && coupon.individual_value_bdt !== null) {
    parts.push(`${verb(coupon.individual_value_bdt)} individual`);
  }
  if (coupon.applies_to_team && coupon.team_value_bdt !== null) {
    parts.push(`${verb(coupon.team_value_bdt)} team`);
  }
  return parts.join(" · ");
}

export function describeAppliesTo(coupon: Pick<CouponShape, "applies_to_individual" | "applies_to_team">) {
  if (coupon.applies_to_individual && coupon.applies_to_team) return "Individual and team";
  return coupon.applies_to_individual ? "Individual only" : "Team only";
}

export type CouponState = "live" | "off" | "scheduled" | "expired" | "used_up";

export const COUPON_STATE_LABEL: Record<CouponState, string> = {
  live: "Live",
  off: "Off",
  scheduled: "Scheduled",
  expired: "Ended",
  used_up: "Used up",
};

/** Whether a member could use this coupon right now, and if not, the first reason why. */
export function couponState(coupon: CouponShape, used: number, now = new Date()): CouponState {
  if (!coupon.is_active) return "off";
  if (coupon.ends_at && new Date(coupon.ends_at) <= now) return "expired";
  if (coupon.starts_at && new Date(coupon.starts_at) > now) return "scheduled";
  if (coupon.max_redemptions !== null && used >= coupon.max_redemptions) return "used_up";
  return "live";
}

/** A displayed coupon as the campaign pages show it. `code` is null when the admin keeps
 *  it private. Chosen and priced in Postgres by campaign_offers(). */
export type CampaignOffer = {
  code: string | null;
  message: string;
  originalFee: number;
  discount: number;
  finalFee: number;
};

export type CampaignOffers = { individual?: CampaignOffer; team?: CampaignOffer };

/** The distinct messages across a campaign's offers, so a coupon covering both
 *  individual and team is only described once. */
export function offerNotes(offers: CampaignOffers | undefined) {
  const notes = new Map<string, { message: string; code: string | null }>();
  for (const offer of [offers?.individual, offers?.team]) {
    if (!offer) continue;
    notes.set(`${offer.code ?? ""}|${offer.message}`, { message: offer.message, code: offer.code });
  }
  return [...notes.values()];
}

/** Uses against the cap, e.g. "12 / 50", or just the count when uncapped. */
export const usesLabel = (used: number, cap: number | null) => (cap === null ? String(used) : `${used} / ${cap}`);

/** Postgres raises these as bare codes; members and admins both read them here. */
const COUPON_ERROR: Record<string, string> = {
  coupon_not_found: "That coupon code is not valid.",
  coupon_not_started: "That coupon is not active yet.",
  coupon_expired: "That coupon has expired.",
  coupon_not_for_campaign: "That coupon does not apply to this campaign.",
  coupon_not_for_type: "That coupon does not apply to this kind of registration.",
  coupon_used_up: "That coupon has been fully used.",
  coupon_code_taken: "Another coupon already uses this code.",
  coupon_needs_campaign: "Pick at least one campaign, or apply it to every campaign.",
  invalid_coupon: "Some of these values do not fit together. Check the form and try again.",
  not_authorised: "You do not have access to this.",
  not_authenticated: "Your session expired. Sign in again.",
  registration_closed: "Registration for this campaign has closed.",
  invalid_type: "Pick how you are registering first.",
};

export const isCouponError = (raw: string | null | undefined) => (raw ?? "").trim().startsWith("coupon_");

export function couponErrorMessage(raw: string | null | undefined, fallback = "Could not check that coupon. Try again in a moment.") {
  return COUPON_ERROR[(raw ?? "").trim()] ?? fallback;
}
