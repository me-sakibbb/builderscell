import { createClient } from "@/lib/supabase/server";
import type { Json, Tables } from "@/lib/supabase/types";
import {
  emptyDraft,
  emptyMember,
  toNationalPhone,
  type DraftValues,
  type SubmissionValues,
} from "@/lib/validation/registration";
import type { getRegistrationProfile } from "@/lib/queries/profile";

/** Every read and write on registrations lives here. Submission and review are database
 *  functions, so status, fees and seat counts are never decided in the app. */

export type Registration = Tables<"registrations">;
export type RegistrationMember = Tables<"registration_members">;

export const MY_REGISTRATIONS_PAGE_SIZE = 5;
export const REVIEW_PAGE_SIZE = 20;

const MEMBER_COLUMNS =
  "id, position, user_id, full_name, email, phone, dob, institution_id, institution_other, class_level, section, roll, guardian_name, guardian_phone, address, consent_guardian, consent_media, consent_safety, institution:institutions(name, short_name, type, eiin, code)";

export type MemberWithInstitution = Omit<RegistrationMember, "registration_id" | "created_at"> & {
  institution: { name: string; short_name: string | null; type: string; eiin: string | null; code: string | null } | null;
};

type RegistrationProfile = NonNullable<Awaited<ReturnType<typeof getRegistrationProfile>>>;

/** A fresh wizard for a member who has never registered: participant 1 is them. */
export function draftFromProfile(profile: RegistrationProfile | null, fallbackEmail: string | null): DraftValues {
  const base = emptyDraft();
  if (!profile) return base;

  return {
    ...base,
    members: [
      {
        ...emptyMember(),
        fullName: profile.full_name ?? "",
        email: profile.email ?? fallbackEmail ?? "",
        phone: toNationalPhone(profile.phone),
        dob: profile.dob ?? "",
        institutionId: profile.institution_id,
        institutionOther: profile.institution_other ?? "",
        institutionName: profile.institution?.name ?? "",
        classLevel: profile.class_level ? String(profile.class_level) : "",
        section: profile.section ?? "",
        roll: profile.roll ?? "",
        guardianName: profile.guardian_name ?? "",
        guardianPhone: toNationalPhone(profile.guardian_phone),
        address: profile.address ?? "",
      },
    ],
  };
}

export async function getDraftRegistration(userId: string, campaignId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("registrations")
    .select("id, draft, step, updated_at")
    .eq("user_id", userId)
    .eq("campaign_id", campaignId)
    .eq("status", "draft")
    .maybeSingle();

  return data;
}

/** The registration that currently holds this member's place, if any. */
export async function getSubmittedRegistration(userId: string, campaignId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("registrations")
    .select("*")
    .eq("user_id", userId)
    .eq("campaign_id", campaignId)
    .neq("status", "draft")
    .order("submitted_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  return data;
}

export async function getRegistrationWithMembers(registrationId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("registrations")
    .select(`*, campaign:campaigns(id, slug, title, status), members:registration_members(${MEMBER_COLUMNS})`)
    .eq("id", registrationId)
    .order("position", { referencedTable: "registration_members", ascending: true })
    .maybeSingle();

  return data;
}

export type RegistrationDetail = NonNullable<Awaited<ReturnType<typeof getRegistrationWithMembers>>>;

/** The member's own registrations, newest first, one page at a time. */
export async function listMyRegistrations(userId: string, page: number, pageSize = MY_REGISTRATIONS_PAGE_SIZE) {
  const supabase = await createClient();
  const current = Math.max(1, page);
  const from = (current - 1) * pageSize;

  const { data, count } = await supabase
    .from("registrations")
    .select("id, status, type, member_count, fee_bdt, submitted_at, review_note, campaign:campaigns(slug, title)", {
      count: "exact",
    })
    .eq("user_id", userId)
    .neq("status", "draft")
    .order("submitted_at", { ascending: false, nullsFirst: false })
    .range(from, from + pageSize - 1);

  const total = count ?? 0;

  return {
    items: data ?? [],
    total,
    page: current,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export type RegistrationStats = { total: number; pending: number; approved: number; rejected: number };

/** Headline counts for the dashboard overview. A member holds a handful of rows, so one
 *  read and a tally here beats four round trips - and it keeps the maths out of the page. */
export async function getMyRegistrationStats(userId: string): Promise<RegistrationStats> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("registrations")
    .select("status")
    .eq("user_id", userId)
    .neq("status", "draft");

  const rows = data ?? [];
  const count = (status: string) => rows.filter((row) => row.status === status).length;

  return {
    total: rows.length,
    pending: count("pending"),
    approved: count("approved"),
    rejected: count("rejected"),
  };
}

/** Creates the draft row on first save, then keeps updating that same row. */
export async function saveDraft(params: {
  userId: string;
  campaignId: string;
  registrationId: string | null;
  draft: DraftValues;
  step: number;
}) {
  const supabase = await createClient();
  const payload = { draft: params.draft as unknown as Json, step: params.step };

  if (params.registrationId) {
    const { data } = await supabase
      .from("registrations")
      .update(payload)
      .eq("id", params.registrationId)
      .eq("user_id", params.userId)
      .eq("status", "draft")
      .select("id")
      .maybeSingle();

    if (data) return { id: data.id, error: null };
    // The draft was submitted or removed in another tab: fall through and start a new one.
  }

  const { data, error } = await supabase
    .from("registrations")
    .insert({ user_id: params.userId, campaign_id: params.campaignId, ...payload })
    .select("id")
    .single();

  return { id: data?.id ?? null, error: error?.message ?? null };
}

/** Hands the whole submission to Postgres, which owns the seat, duplicate and fee rules. */
export async function submitRegistration(registrationId: string, values: SubmissionValues) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("submit_registration", {
    p_registration_id: registrationId,
    p_payload: values as unknown as Json,
  });

  return { id: data ?? null, error: error?.message ?? null };
}

export async function lookupMemberByEmail(email: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("find_member_by_email", { p_email: email });
  return { member: data?.[0] ?? null, error: error?.message ?? null };
}

/** Review queue: filtered, searched and paged in Postgres. */
export async function listRegistrationsForReview(params: {
  campaignId: string | null;
  status: string | null;
  query: string;
  page: number;
  pageSize?: number;
}) {
  const supabase = await createClient();
  const pageSize = params.pageSize ?? REVIEW_PAGE_SIZE;
  const current = Math.max(1, params.page);

  const { data, error } = await supabase.rpc("admin_list_registrations", {
    p_campaign: params.campaignId ?? undefined,
    p_status: params.status ?? undefined,
    p_q: params.query,
    p_limit: pageSize,
    p_offset: (current - 1) * pageSize,
  });

  const items = data ?? [];
  const total = Number(items[0]?.total_count ?? 0);

  return {
    items,
    total,
    page: current,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    error: error?.message ?? null,
  };
}

export type ReviewRow = Awaited<ReturnType<typeof listRegistrationsForReview>>["items"][number];

export async function reviewRegistration(registrationId: string, action: "approve" | "reject", note: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("review_registration", {
    p_registration_id: registrationId,
    p_action: action,
    p_note: note,
  });

  return { error: error?.message ?? null };
}
