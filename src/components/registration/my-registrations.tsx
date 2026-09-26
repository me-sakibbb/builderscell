import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { StatusBadge } from "@/components/registration/status-badge";
import { Pagination } from "@/components/ui/pagination";
import { bdt } from "@/content/site";
import { listMyRegistrations } from "@/lib/queries/registrations";

const day = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });

/** The member's registrations, one page at a time. The caller supplies the heading and
 *  the base path the pager builds its links from. */
export async function MyRegistrations({
  userId,
  page,
  basePath,
}: {
  userId: string;
  page: number;
  basePath: string;
}) {
  const { items, page: current, pageCount } = await listMyRegistrations(userId, page);

  if (items.length === 0) {
    return (
      <p className="rounded-2xl hairline bg-surface/60 px-5 py-8 text-center text-sm text-muted">
        You have not registered for anything yet.
      </p>
    );
  }

  return (
    <>
      <ul className="divide-y divide-line border-y border-line">
        {items.map((row) => (
          <li key={row.id}>
            <Link
              href={`/campaigns/${row.campaign?.slug}/register`}
              className="group grid gap-2 py-4 transition-colors hover:text-accent-ink sm:grid-cols-[1fr_auto] sm:items-center sm:gap-6"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-medium text-fg">{row.campaign?.title}</span>
                  <StatusBadge status={row.status} />
                </div>
                <p className="mt-1 text-xs text-muted">
                  {row.type === "team" ? `Team of ${row.member_count}` : "Individual"}
                  {row.fee_bdt !== null ? ` · ${bdt(row.fee_bdt)}` : ""}
                  {row.submitted_at ? ` · ${day.format(new Date(row.submitted_at))}` : ""}
                </p>
              </div>
              <ArrowUpRight
                aria-hidden
                className="size-5 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </Link>
          </li>
        ))}
      </ul>

      <Pagination
        className="mt-6"
        page={current}
        pageCount={pageCount}
        hrefFor={(target) => (target <= 1 ? basePath : `${basePath}?page=${target}`)}
        label="Your registrations"
      />
    </>
  );
}
