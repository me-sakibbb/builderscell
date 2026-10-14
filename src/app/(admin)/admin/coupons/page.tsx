import type { Metadata } from "next";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { CouponList } from "@/components/admin/coupon-list";
import { inputClass } from "@/components/ui/field";
import { Pagination } from "@/components/ui/pagination";
import { listCoupons } from "@/lib/queries/coupons";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Coupons | Builders' Cell admin" };

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? (value[0] ?? "") : (value ?? ""));

export default async function AdminCouponsPage({ searchParams }: PageProps<"/admin/coupons">) {
  const params = await searchParams;
  const query = first(params.q);
  const page = Number(first(params.page)) || 1;

  const { items, total, page: current, pageCount, error } = await listCoupons({ query, page });

  const hrefFor = (target: number) => {
    const search = new URLSearchParams();
    if (query) search.set("q", query);
    if (target > 1) search.set("page", String(target));
    const qs = search.toString();
    return qs ? `/admin/coupons?${qs}` : "/admin/coupons";
  };

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-3xl sm:text-4xl">Coupons</h1>
          <p className="mt-2 text-muted">
            {total} {total === 1 ? "coupon" : "coupons"}. A coupon is live while switched on and inside its window.
          </p>
        </div>

        <Link
          href="/admin/coupons/new"
          className="inline-flex h-12 items-center gap-2 rounded-xl bg-fg px-6 text-sm font-medium text-bg transition-colors hover:bg-accent hover:text-accent-fg"
        >
          <Plus aria-hidden className="size-4" />
          New coupon
        </Link>
      </header>

      <form method="get" className="mt-8 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="space-y-2">
          <label htmlFor="q" className="block text-sm font-medium text-fg">
            Search
          </label>
          <div className="relative">
            <Search aria-hidden className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={query}
              placeholder="Code or note"
              className={cn(inputClass, "pl-10")}
            />
          </div>
        </div>
        <button
          type="submit"
          className="h-12 rounded-xl bg-fg px-6 text-sm font-medium text-bg transition-colors hover:bg-accent hover:text-accent-fg"
        >
          Apply
        </button>
      </form>

      {error ? (
        <p role="alert" className="mt-10 rounded-2xl border border-signal/30 bg-signal/10 px-5 py-4 text-sm text-signal">
          Could not load coupons: {error}
        </p>
      ) : items.length === 0 ? (
        <p className="mt-10 rounded-2xl hairline bg-surface/60 px-6 py-10 text-center text-muted">
          {query ? "No coupon matches that search." : "No coupons yet. Create one to offer a discount."}
        </p>
      ) : (
        <>
          <CouponList items={items} now={new Date()} className="mt-8" />
          <Pagination className="mt-10" page={current} pageCount={pageCount} hrefFor={hrefFor} />
        </>
      )}
    </div>
  );
}
