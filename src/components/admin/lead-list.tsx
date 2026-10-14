import { LeadContactedToggle } from "@/components/admin/lead-controls";
import type { LeadRow } from "@/lib/queries/leads";
import { gradeLabel, leadDateTime } from "@/lib/validation/lead";
import { cn } from "@/lib/cn";

/** Leads as a list: who they are, how to reach them, and whether someone has. */
export function LeadList({ items, showEvent, className }: { items: LeadRow[]; showEvent: boolean; className?: string }) {
  return (
    <ul className={cn("divide-y divide-line border-y border-line", className)}>
      {items.map((row) => (
        <li key={row.id} className="grid gap-4 py-5 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-6 sm:px-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-medium text-fg">{row.full_name}</span>
              <span className="inline-flex h-7 items-center rounded-full border border-line px-3 label-xs text-muted">
                {gradeLabel(row.grade)}
              </span>
            </div>
            <p className="mt-1 truncate text-sm text-fg">{row.institution_name}</p>
            <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <a href={`tel:${row.phone}`} className="font-mono text-fg transition-colors hover:text-accent-ink">
                {row.phone}
              </a>
              <a href={`mailto:${row.email}`} className="truncate text-muted transition-colors hover:text-accent-ink">
                {row.email}
              </a>
            </p>
            <p className="mt-1 font-mono text-[11px] text-muted">
              {leadDateTime.format(new Date(row.created_at))}
              {showEvent ? ` · ${row.event_title}` : ""}
            </p>
          </div>

          <LeadContactedToggle leadId={row.id} contacted={Boolean(row.contacted_at)} name={row.full_name} />
        </li>
      ))}
    </ul>
  );
}
