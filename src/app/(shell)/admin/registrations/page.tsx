import type { Metadata } from "next";
import Link from "next/link";
import { ReviewFilters } from "@/components/admin/review-filters";
import { StatusBadge } from "@/components/registration/status-badge";
import { Pagination } from "@/components/ui/pagination";
import { bdt } from "@/content/site";
import { getCampaignStats, listCampaignOptions } from "@/lib/queries/campaigns";
import { listRegistrationsForReview } from "@/lib/queries/registrations";

export const metadata: Metadata = { title: "Registrations | Builders' Cell admin" };

const dateTime = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? (value[0] ?? "") : (value ?? ""));

export default async function AdminRegistrationsPage({ searchParams }: PageProps<"/admin/registrations">) {
  const params = await searchParams;
  const campaignSlug = first(params.campaign);
  const status = first(params.status);
  const query = first(params.q);
  const page = Number(first(params.page)) || 1;

  const campaigns = await listCampaignOptions();
  const campaign = campaigns.find((row) => row.slug === campaignSlug) ?? null;

  const [{ items, page: current, pageCount, total, error }, stats] = await Promise.all([
    listRegistrationsForReview({
      campaignId: campaign?.id ?? null,
      status: status || null,
      query,
      page,
    }),
    campaign ? getCampaignStats(campaign.id) : Promise.resolve(null),
  ]);

  const hrefFor = (target: number) => {
    const search = new URLSearchParams();
    if (campaignSlug) search.set("campaign", campaignSlug);
    if (status) search.set("status", status);
    if (query) search.set("q", query);
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
          <dl className="flex flex-wrap gap-3">
            {[
              { label: "Pending", value: String(stats.pending) },
              { label: "Approved", value: String(stats.approved) },
              { label: "Rejected", value: String(stats.rejected) },
              {
                label: "Seats",
                value: stats.capacity === null ? String(stats.seats_taken) : `${stats.seats_taken} / ${stats.capacity}`,
              },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl hairline bg-surface/60 px-4 py-3">
                <dt className="label-xs text-muted">{stat.label}</dt>
                <dd className="mt-1 font-mono text-lg tabular-nums text-fg">{stat.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </header>

      <div className="mt-8">
        <ReviewFilters campaigns={campaigns} campaign={campaignSlug} status={status} query={query} />
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
          <ul className="mt-8 divide-y divide-line border-y border-line">
            {items.map((row) => (
              <li key={row.id}>
                <Link
                  href={`/admin/registrations/${row.id}`}
                  className="grid gap-3 py-5 transition-colors hover:bg-surface/40 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-6 sm:px-2"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-medium text-fg">{row.lead_name ?? "Unnamed"}</span>
                      <StatusBadge status={row.status} />
                    </div>
                    <p className="mt-1 truncate text-sm text-muted">
                      {row.campaign_title} · {row.type === "team" ? `Team of ${row.member_count}` : "Individual"}
                      {row.member_names?.length > 1 ? ` · ${row.member_names.join(", ")}` : ""}
                    </p>
                    <p className="mt-1 font-mono text-[11px] text-muted">
                      {row.transaction_id} · {row.fee_bdt !== null ? bdt(row.fee_bdt) : "—"}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-[11px] text-muted sm:text-right">
                    {row.submitted_at ? dateTime.format(new Date(row.submitted_at)) : "—"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <Pagination className="mt-10" page={current} pageCount={pageCount} hrefFor={hrefFor} />
        </>
      )}
    </div>
  );
}
