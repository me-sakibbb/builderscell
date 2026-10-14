import { createClient } from "@/lib/supabase/server";
import { listRegistrationsForReview } from "@/lib/queries/registrations";

/** Reads for the admin overview. Counting happens in Postgres; the database re-checks
 *  that the caller is an admin on every call. */

export const CAMPAIGN_OVERVIEW_PAGE_SIZE = 10;
export const RECENT_PENDING_COUNT = 5;

export async function getOverviewStats() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_overview_stats");
  const row = data?.[0];

  return {
    stats: {
      total: row?.total ?? 0,
      pending: row?.pending ?? 0,
      approved: row?.approved ?? 0,
      rejected: row?.rejected ?? 0,
    },
    error: error?.message ?? null,
  };
}

/** One row per campaign, drafts included, one page at a time. */
export async function listCampaignOverview(page: number, pageSize = CAMPAIGN_OVERVIEW_PAGE_SIZE) {
  const supabase = await createClient();
  const current = Math.max(1, page);

  const { data, error } = await supabase.rpc("admin_campaign_overview", {
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

export type CampaignOverviewRow = Awaited<ReturnType<typeof listCampaignOverview>>["items"][number];

/** The newest few registrations waiting on a decision. */
export async function listRecentPending() {
  return listRegistrationsForReview({
    campaignId: null,
    status: "pending",
    query: "",
    page: 1,
    pageSize: RECENT_PENDING_COUNT,
  });
}
