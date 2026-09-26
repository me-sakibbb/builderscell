import { Search } from "lucide-react";
import { Select } from "@/components/ui/select";
import { inputClass } from "@/components/ui/field";
import { REGISTRATION_STATUS_LABEL } from "@/lib/validation/registration";
import { cn } from "@/lib/cn";

const STATUSES = ["pending", "approved", "rejected"] as const;

/** Plain GET form: filtering survives a reload and needs no client JavaScript. */
export function ReviewFilters({
  campaigns,
  campaign,
  status,
  query,
}: {
  campaigns: { id: string; slug: string; title: string; status: string }[];
  campaign: string;
  status: string;
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
            placeholder="Name, email, phone or transaction ID"
            className={cn(inputClass, "pl-10")}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="campaign" className="block text-sm font-medium text-fg">
          Campaign
        </label>
        <Select id="campaign" name="campaign" defaultValue={campaign} className="sm:w-56">
          <option value="">All campaigns</option>
          {campaigns.map((row) => (
            <option key={row.id} value={row.slug}>
              {row.title}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <label htmlFor="status" className="block text-sm font-medium text-fg">
          Status
        </label>
        <Select id="status" name="status" defaultValue={status} className="sm:w-44">
          <option value="">All statuses</option>
          {STATUSES.map((value) => (
            <option key={value} value={value}>
              {REGISTRATION_STATUS_LABEL[value]}
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
