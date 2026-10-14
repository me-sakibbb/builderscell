import type { Metadata } from "next";
import { Download } from "lucide-react";
import { LeadFilters } from "@/components/admin/lead-filters";
import { LeadList } from "@/components/admin/lead-list";
import { Pagination } from "@/components/ui/pagination";
import { listLeads, resolveLeadFilters } from "@/lib/queries/leads";

export const metadata: Metadata = { title: "Leads | Builders' Cell admin" };

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? (value[0] ?? "") : (value ?? ""));

export default async function AdminLeadsPage({ searchParams }: PageProps<"/admin/leads">) {
  const params = await searchParams;
  const search = { event: first(params.event), contacted: first(params.contacted), q: first(params.q) };
  const page = Number(first(params.page)) || 1;

  const { events, event, filters } = await resolveLeadFilters(search);
  const { items, total, page: current, pageCount, error } = await listLeads({ ...filters, page });

  const filterQuery = () => {
    const qs = new URLSearchParams();
    if (event) qs.set("event", event.slug);
    if (filters.contacted) qs.set("contacted", filters.contacted);
    if (filters.query) qs.set("q", filters.query);
    return qs;
  };

  const hrefFor = (target: number) => {
    const qs = filterQuery();
    if (target > 1) qs.set("page", String(target));
    const s = qs.toString();
    return s ? `/admin/leads?${s}` : "/admin/leads";
  };

  const exportQs = filterQuery().toString();
  const exportHref = exportQs ? `/admin/leads/export?${exportQs}` : "/admin/leads/export";

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-3xl sm:text-4xl">Leads</h1>
          <p className="mt-2 text-muted">
            {total} {total === 1 ? "lead" : "leads"} match this view. Left on the landing page at outreach events.
          </p>
        </div>

        {/* A plain link: the browser downloads the file the route hands back. */}
        <a
          href={exportHref}
          aria-disabled={total === 0}
          className="inline-flex h-12 items-center gap-2 rounded-xl hairline px-6 text-sm font-medium text-fg transition-colors hover:border-line-strong hover:bg-surface aria-disabled:pointer-events-none aria-disabled:opacity-60"
        >
          <Download aria-hidden className="size-4" />
          Export CSV
        </a>
      </header>

      <div className="mt-8">
        <LeadFilters events={events} event={event?.slug ?? ""} contacted={filters.contacted ?? ""} query={filters.query} />
      </div>

      {error ? (
        <p role="alert" className="mt-10 rounded-2xl border border-signal/30 bg-signal/10 px-5 py-4 text-sm text-signal">
          Could not load leads: {error}
        </p>
      ) : items.length === 0 ? (
        <p className="mt-10 rounded-2xl hairline bg-surface/60 px-6 py-10 text-center text-muted">
          {filters.query || filters.contacted || event
            ? "No lead matches this view."
            : "No leads yet. They appear here as visitors fill in the form on the landing page."}
        </p>
      ) : (
        <>
          <LeadList items={items} showEvent={!event} className="mt-8" />
          <Pagination className="mt-10" page={current} pageCount={pageCount} hrefFor={hrefFor} />
        </>
      )}
    </div>
  );
}
