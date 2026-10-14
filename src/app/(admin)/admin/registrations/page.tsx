import type { Metadata } from "next";
import { ReviewFilters } from "@/components/admin/review-filters";
import { ReviewList } from "@/components/admin/review-list";
import { seatsLabel, StatTiles } from "@/components/admin/stat-tiles";
import { Pagination } from "@/components/ui/pagination";
import { getCampaignStats, listCampaignOptions } from "@/lib/queries/campaigns";
import { listRegistrationsForReview } from "@/lib/queries/registrations";

export const metadata: Metadata = { title: "Registrations | Builders' Cell admin" };

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? (value[0] ?? "") : (value ?? ""));

export default async function AdminRegistrationsPage({ searchParams }: PageProps<"/admin/registrations">) {
  const params = await searchParams;
  const campaignSlug = first(params.campaign);
  const status = first(params.status);
  const query = first(params.q);
  const coupon = first(params.coupon).trim().toUpperCase();
  const page = Number(first(params.page)) || 1;

  const campaigns = await listCampaignOptions();
  const campaign = campaigns.find((row) => row.slug === campaignSlug) ?? null;

  const [{ items, page: current, pageCount, total, error }, stats] = await Promise.all([
    listRegistrationsForReview({
      campaignId: campaign?.id ?? null,
      status: status || null,
      query,
      coupon,
      page,
    }),
    campaign ? getCampaignStats(campaign.id) : Promise.resolve(null),
  ]);

  const hrefFor = (target: number) => {
    const search = new URLSearchParams();
    if (campaignSlug) search.set("campaign", campaignSlug);
    if (status) search.set("status", status);
    if (query) search.set("q", query);
    if (coupon) search.set("coupon", coupon);
    if (target > 1) search.set("page", String(target));
    const qs = search.toString();
    return qs ? `/admin/registrations?${qs}` : "/admin/registrations";
  };

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-3xl sm:text-4xl">Registrations</h1>
          <p className="mt-2 text-muted">
            {total} {total === 1 ? "registration" : "registrations"} match this view.
          </p>
        </div>

        {stats && (
          <StatTiles
            stats={[
              { label: "Pending", value: String(stats.pending) },
              { label: "Approved", value: String(stats.approved) },
              { label: "Rejected", value: String(stats.rejected) },
              { label: "Seats", value: seatsLabel(stats.seats_taken, stats.capacity) },
            ]}
          />
        )}
      </header>

      <div className="mt-8">
        <ReviewFilters campaigns={campaigns} campaign={campaignSlug} status={status} query={query} coupon={coupon} />
      </div>

      {error ? (
        <p role="alert" className="mt-10 rounded-2xl border border-signal/30 bg-signal/10 px-5 py-4 text-sm text-signal">
          Could not load registrations: {error}
        </p>
      ) : items.length === 0 ? (
        <p className="mt-10 rounded-2xl hairline bg-surface/60 px-6 py-10 text-center text-muted">
          Nothing matches this view yet.
        </p>
      ) : (
        <>
          <ReviewList items={items} className="mt-8" />

          <Pagination className="mt-10" page={current} pageCount={pageCount} hrefFor={hrefFor} />
        </>
      )}
    </div>
  );
}
