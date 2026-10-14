import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";
import { CAMPAIGN_STATUS_LABEL, listCampaignOptions } from "@/lib/queries/campaigns";
import type { CampaignOffers, CouponPayload } from "@/lib/validation/coupon";

/** Every read and write on coupons lives here. Coupons are admin-only in the database;
 *  members only ever reach them through preview_coupon(), one exact code at a time. */

export const COUPONS_PAGE_SIZE = 20;

/** Coupons with their pending and approved use counts, newest first, one page at a time. */
export async function listCoupons(params: { query: string; page: number; pageSize?: number }) {
  const supabase = await createClient();
  const pageSize = params.pageSize ?? COUPONS_PAGE_SIZE;
  const current = Math.max(1, params.page);

  const { data, error } = await supabase.rpc("admin_list_coupons", {
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

export type CouponRow = Awaited<ReturnType<typeof listCoupons>>["items"][number];

/** One coupon for the edit page: its columns, the campaigns it is tied to, and how many
 *  pending and approved registrations hold a use. */
export async function getCoupon(id: string) {
  const supabase = await createClient();

  const countByStatus = (status: "pending" | "approved") =>
    supabase
      .from("registrations")
      .select("id", { count: "exact", head: true })
      .eq("coupon_id", id)
      .eq("status", status);

  const [{ data: coupon }, { count: pending }, { count: approved }] = await Promise.all([
    supabase.from("coupons").select("*, links:coupon_campaigns(campaign_id)").eq("id", id).maybeSingle(),
    countByStatus("pending"),
    countByStatus("approved"),
  ]);

  if (!coupon) return null;

  const { links, ...rest } = coupon;
  return {
    ...rest,
    campaignIds: (links ?? []).map((link) => link.campaign_id),
    pending: pending ?? 0,
    approved: approved ?? 0,
  };
}

export type CouponDetail = NonNullable<Awaited<ReturnType<typeof getCoupon>>>;

/** Campaigns the editor can tie a coupon to, drafts included, labelled for the picker. */
export async function listCouponCampaignOptions() {
  const campaigns = await listCampaignOptions();
  return campaigns.map((campaign) => ({
    id: campaign.id,
    title: campaign.title,
    statusLabel: CAMPAIGN_STATUS_LABEL[campaign.status] ?? campaign.status,
  }));
}

/** Whether any registration, of any status, carries this coupon. Such a coupon is kept
 *  for the record and can only be switched off. */
export async function isCouponReferenced(id: string) {
  const supabase = await createClient();
  const { count } = await supabase
    .from("registrations")
    .select("id", { count: "exact", head: true })
    .eq("coupon_id", id);
  return (count ?? 0) > 0;
}

/** Create (id null) or edit, campaign links included, in one transaction. */
export async function saveCoupon(id: string | null, payload: CouponPayload) {
  const supabase = await createClient();
  // The generated type marks p_id required; null is how a new coupon is asked for.
  const { data, error } = await supabase.rpc("admin_save_coupon", {
    p_id: id as unknown as string,
    p_payload: payload as unknown as Json,
  });

  return { id: data ?? null, error: error?.message ?? null };
}

export async function setCouponActive(id: string, active: boolean) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coupons")
    .update({ is_active: active })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  return { error: error?.message ?? (data ? null : "coupon_not_found") };
}

export async function deleteCoupon(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("coupons").delete().eq("id", id);
  return { error: error?.message ?? null };
}

/** Advertised coupon prices for a page of campaigns, keyed by campaign id. Postgres
 *  picks the best live displayed coupon per registration type and hides private codes. */
export async function getCampaignOffers(campaignIds: string[]): Promise<Record<string, CampaignOffers>> {
  if (campaignIds.length === 0) return {};

  const supabase = await createClient();
  const { data } = await supabase.rpc("campaign_offers", { p_campaign_ids: campaignIds });

  const offers: Record<string, CampaignOffers> = {};
  for (const row of data ?? []) {
    if (row.type !== "individual" && row.type !== "team") continue;
    (offers[row.campaign_id] ??= {})[row.type] = {
      code: row.code ?? null,
      message: row.message,
      originalFee: row.original_fee,
      discount: row.discount,
      finalFee: row.final_fee,
    };
  }
  return offers;
}

/** The price a member would pay with this code. Every rule is checked in Postgres. */
export async function previewCoupon(params: { campaignId: string; type: "individual" | "team"; code: string }) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("preview_coupon", {
    p_campaign_id: params.campaignId,
    p_type: params.type,
    p_code: params.code,
  });

  const row = data?.[0];
  return {
    quote: row
      ? { code: row.code, originalFee: row.original_fee, discount: row.discount, finalFee: row.final_fee }
      : null,
    error: error?.message ?? null,
  };
}

export type CouponQuote = NonNullable<Awaited<ReturnType<typeof previewCoupon>>["quote"]>;
