import { cn } from "@/lib/cn";

export type StatTile = { label: string; value: string };

/** A row of headline numbers, used on the overview and the review queue. */
export function StatTiles({ stats, className }: { stats: StatTile[]; className?: string }) {
  return (
    <dl className={cn("flex flex-wrap gap-3", className)}>
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-xl hairline bg-surface/60 px-4 py-3">
          <dt className="label-xs text-muted">{stat.label}</dt>
          <dd className="mt-1 font-mono text-lg tabular-nums text-fg">{stat.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Seats as "taken / capacity", or just the count when the campaign is uncapped. */
export const seatsLabel = (taken: number, capacity: number | null) =>
  capacity === null ? String(taken) : `${taken} / ${capacity}`;
