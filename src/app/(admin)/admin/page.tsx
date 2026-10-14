import type { Metadata } from "next";
import Link from "next/link";
import { ReviewList } from "@/components/admin/review-list";
import { seatsLabel, StatTiles } from "@/components/admin/stat-tiles";
import { Pagination } from "@/components/ui/pagination";
import { getOverviewStats, listCampaignOverview, listRecentPending } from "@/lib/queries/admin";
import { CAMPAIGN_STATUS_LABEL } from "@/lib/queries/campaigns";

export const metadata: Metadata = { title: "Overview | Builders' Cell admin" };

export default async function AdminOverviewPage({ searchParams }: PageProps<"/admin">) {
  const params = await searchParams;
  const page = Number(Array.isArray(params.page) ? params.page[0] : params.page) || 1;

  const [{ stats, error: statsError }, campaigns, pending] = await Promise.all([
    getOverviewStats(),
    listCampaignOverview(page),
    listRecentPending(),
  ]);

  const hrefFor = (target: number) => (target > 1 ? `/admin?page=${target}` : "/admin");

  return (
    <div>
      <header>
        <h1 className="display text-3xl sm:text-4xl">Overview</h1>
        <p className="mt-2 text-muted">Registrations across every campaign.</p>
      </header>

      {statsError ? (
        <ErrorNote>Could not load the counts: {statsError}</ErrorNote>
      ) : (
        <StatTiles
          className="mt-8"
          stats={[
            { label: "Submitted", value: String(stats.total) },
            { label: "Pending", value: String(stats.pending) },
            { label: "Approved", value: String(stats.approved) },
            { label: "Rejected", value: String(stats.rejected) },
          ]}
        />
      )}

      <section className="mt-14">
        <SectionHead title="Waiting for review">
          {pending.total > 0 && (
            <Link href="/admin/registrations?status=pending" className="text-sm text-muted transition-colors hover:text-fg">
              All {pending.total} pending
            </Link>
          )}
        </SectionHead>

        {pending.error ? (
          <ErrorNote>Could not load pending registrations: {pending.error}</ErrorNote>
        ) : pending.items.length === 0 ? (
          <EmptyNote>Nothing is waiting for review.</EmptyNote>
        ) : (
          <ReviewList items={pending.items} className="mt-6" />
        )}
      </section>

      <section className="mt-14">
        <SectionHead title="Campaigns" />

        {campaigns.error ? (
          <ErrorNote>Could not load campaigns: {campaigns.error}</ErrorNote>
        ) : campaigns.items.length === 0 ? (
          <EmptyNote>No campaigns yet.</EmptyNote>
        ) : (
          <>
            <ul className="mt-6 divide-y divide-line border-y border-line">
              {campaigns.items.map((row) => (
                <li key={row.id}>
                  <Link
                    href={`/admin/registrations?campaign=${encodeURIComponent(row.slug)}`}
                    className="grid gap-3 py-5 transition-colors hover:bg-surface/40 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-6 sm:px-2"
                  >
                    <div className="min-w-0">
                      <span className="block truncate text-base font-medium text-fg">{row.title}</span>
                      <span className="mt-1 block label-xs text-muted">
                        {CAMPAIGN_STATUS_LABEL[row.status] ?? row.status}
                      </span>
                    </div>
                    <dl className="grid grid-cols-4 gap-4 font-mono text-[11px] text-muted sm:gap-6">
                      {[
                        { label: "Pending", value: String(row.pending) },
                        { label: "Approved", value: String(row.approved) },
                        { label: "Rejected", value: String(row.rejected) },
                        { label: "Seats", value: seatsLabel(row.seats_taken, row.capacity) },
                      ].map((stat) => (
                        <div key={stat.label} className="sm:text-right">
                          <dt className="label-xs">{stat.label}</dt>
                          <dd className="mt-1 text-sm tabular-nums text-fg">{stat.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </Link>
                </li>
              ))}
            </ul>

            <Pagination className="mt-10" page={campaigns.page} pageCount={campaigns.pageCount} hrefFor={hrefFor} />
          </>
        )}
      </section>
    </div>
  );
}

function SectionHead({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line pb-4">
      <h2 className="label text-muted">{title}</h2>
      {children}
    </div>
  );
}

function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="mt-8 rounded-2xl border border-signal/30 bg-signal/10 px-5 py-4 text-sm text-signal">
      {children}
    </p>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className="mt-6 rounded-2xl hairline bg-surface/60 px-6 py-10 text-center text-muted">{children}</p>;
}
