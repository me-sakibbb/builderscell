import Link from "next/link";
import { StatusBadge } from "@/components/registration/status-badge";
import { bdt } from "@/content/site";
import type { ReviewRow } from "@/lib/queries/registrations";
import { cn } from "@/lib/cn";

const dateTime = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** Submitted registrations as a list, each linking through to its review page. */
export function ReviewList({ items, className }: { items: ReviewRow[]; className?: string }) {
  return (
    <ul className={cn("divide-y divide-line border-y border-line", className)}>
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
                {row.coupon_code ? ` · ${row.coupon_code} −${bdt(row.discount_bdt ?? 0)}` : ""}
              </p>
            </div>
            <span className="shrink-0 font-mono text-[11px] text-muted sm:text-right">
              {row.submitted_at ? dateTime.format(new Date(row.submitted_at)) : "—"}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
