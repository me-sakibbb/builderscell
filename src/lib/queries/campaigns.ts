import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types";

/** Every read of the campaigns table lives here, not in a component. */

export type Campaign = Tables<"campaigns">;

export type CampaignCard = Pick<
  Campaign,
  | "id"
  | "slug"
  | "title"
  | "kind"
  | "status"
  | "eyebrow"
  | "summary"
  | "location"
  | "starts_on"
  | "ends_on"
  | "registration_closes_at"
  | "allows_individual"
  | "allows_team"
  | "individual_fee_bdt"
  | "team_fee_bdt"
>;

export const CAMPAIGNS_PAGE_SIZE = 9;

/** Drafts only ever show up to admins. */
export const CAMPAIGN_STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  open: "Registration open",
  closed: "Registration closed",
  archived: "Finished",
};

const CARD_COLUMNS =
  "id, slug, title, kind, status, eyebrow, summary, location, starts_on, ends_on, registration_closes_at, allows_individual, allows_team, individual_fee_bdt, team_fee_bdt";

/** Published campaigns, newest programme first, one page at a time. */
export async function listCampaigns(page: number, pageSize = CAMPAIGNS_PAGE_SIZE) {
  const supabase = await createClient();
  const current = Math.max(1, page);
  const from = (current - 1) * pageSize;

  const { data, count, error } = await supabase
    .from("campaigns")
    .select(CARD_COLUMNS, { count: "exact" })
    .neq("status", "draft")
    .order("status_rank", { ascending: true })
    .order("starts_on", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  const total = count ?? 0;

  return {
    items: (data ?? []) as CampaignCard[],
    total,
    page: current,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    error: error?.message ?? null,
  };
}

export async function getCampaignBySlug(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("campaigns").select("*").eq("slug", slug).maybeSingle();
  return data;
}

/** Boolean only: seat numbers stay between us and the review pages. */
export async function isCampaignFull(campaignId: string) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("campaign_is_full", { p_campaign_id: campaignId });
  return data === true;
}

/** Admin-only counts for the review pages. */
export async function getCampaignStats(campaignId: string) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("campaign_stats", { p_campaign_id: campaignId });
  return data?.[0] ?? null;
}

/** Campaign picker on the review queue. Admins see drafts too. */
export async function listCampaignOptions() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("campaigns")
    .select("id, slug, title, status")
    .order("status_rank", { ascending: true })
    .order("title", { ascending: true });

  return data ?? [];
}

/** The jsonb columns, read as the shapes the pages expect. Unknown entries are dropped. */

export type Highlight = { title: string; body: string };
export type FeeLine = { label: string; amount: number; note: string };
export type PaymentNumber = { method: string; number: string };

const asRecords = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value) ? value.filter((row): row is Record<string, unknown> => typeof row === "object" && row !== null) : [];

const str = (value: unknown) => (typeof value === "string" ? value : "");

export function campaignHighlights(value: unknown): Highlight[] {
  return asRecords(value)
    .map((row) => ({ title: str(row.title), body: str(row.body) }))
    .filter((row) => row.title || row.body);
}

export function campaignFeeLines(value: unknown): FeeLine[] {
  return asRecords(value)
    .map((row) => ({
      label: str(row.label),
      amount: typeof row.amount === "number" ? row.amount : 0,
      note: str(row.note),
    }))
    .filter((row) => row.label);
}

export function campaignPaymentNumbers(value: unknown): PaymentNumber[] {
  return asRecords(value)
    .map((row) => ({ method: str(row.method), number: str(row.number) }))
    .filter((row) => row.number);
}

/** Whether a campaign takes registrations right now, and why not when it does not. */
export function registrationWindow(campaign: Campaign, now = new Date()) {
  if (campaign.status === "draft") return { open: false, reason: "This campaign is not published yet." };
  if (campaign.status === "archived") return { open: false, reason: "This campaign has finished." };
  if (campaign.status === "closed") return { open: false, reason: "Registration for this campaign has closed." };

  const opens = campaign.registration_opens_at ? new Date(campaign.registration_opens_at) : null;
  const closes = campaign.registration_closes_at ? new Date(campaign.registration_closes_at) : null;

  if (opens && now < opens) return { open: false, reason: "Registration has not opened yet." };
  if (closes && now >= closes) return { open: false, reason: "Registration for this campaign has closed." };

  return { open: true, reason: null };
}
