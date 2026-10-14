import { Search } from "lucide-react";
import { Select } from "@/components/ui/select";
import { inputClass } from "@/components/ui/field";
import type { LeadEventOption } from "@/lib/queries/leads";
import { LEAD_CONTACTED, LEAD_CONTACTED_LABEL } from "@/lib/validation/lead";
import { cn } from "@/lib/cn";

/** Plain GET form: filtering survives a reload and needs no client JavaScript. */
export function LeadFilters({
  events,
  event,
  contacted,
  query,
}: {
  events: LeadEventOption[];
  event: string;
  contacted: string;
  query: string;
}) {
  return (
    <form method="get" className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
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
            placeholder="Name, email, phone or institution"
            className={cn(inputClass, "pl-10")}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="event" className="block text-sm font-medium text-fg">
          Event
        </label>
        <Select id="event" name="event" defaultValue={event} className="sm:w-60">
          <option value="">All events</option>
          {events.map((row) => (
            <option key={row.id} value={row.slug}>
              {row.title} ({row.lead_count})
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <label htmlFor="contacted" className="block text-sm font-medium text-fg">
          Follow-up
        </label>
        <Select id="contacted" name="contacted" defaultValue={contacted} className="sm:w-44">
          <option value="">Everyone</option>
          {LEAD_CONTACTED.map((value) => (
            <option key={value} value={value}>
              {LEAD_CONTACTED_LABEL[value]}
            </option>
          ))}
        </Select>
      </div>

      <button
        type="submit"
        className="h-12 rounded-xl bg-fg px-6 text-sm font-medium text-bg transition-colors hover:bg-accent hover:text-accent-fg"
      >
        Apply
      </button>
    </form>
  );
}
