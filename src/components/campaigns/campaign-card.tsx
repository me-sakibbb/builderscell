import Link from "next/link";
import { ArrowUpRight, CalendarDays, MapPin } from "lucide-react";
import { bdt } from "@/content/site";
import type { CampaignCard as CampaignCardData } from "@/lib/queries/campaigns";
import { cn } from "@/lib/cn";

const day = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });

const STATUS_LABEL: Record<string, string> = {
  open: "Registration open",
  closed: "Registration closed",
  archived: "Finished",
};

export function campaignDateRange(startsOn: string | null, endsOn: string | null) {
  if (!startsOn && !endsOn) return "Dates to be announced";
  if (startsOn && endsOn) return `${day.format(new Date(startsOn))} — ${day.format(new Date(endsOn))}`;
  return day.format(new Date((startsOn ?? endsOn) as string));
}

export function CampaignCard({ campaign }: { campaign: CampaignCardData }) {
  const fees = [
    campaign.allows_individual && campaign.individual_fee_bdt !== null
      ? `${bdt(campaign.individual_fee_bdt)} solo`
      : null,
    campaign.allows_team && campaign.team_fee_bdt !== null ? `${bdt(campaign.team_fee_bdt)} team` : null,
  ].filter(Boolean);

  return (
    <article className="group relative flex h-full flex-col rounded-3xl hairline bg-surface/60 p-6 transition-colors hover:border-line-strong">
      <div className="flex items-center justify-between gap-3">
        <span
          className={cn(
            "inline-flex h-7 items-center rounded-full border px-3 label-xs",
            campaign.status === "open" ? "border-accent bg-accent/10 text-accent-ink" : "border-line text-muted",
          )}
        >
          {STATUS_LABEL[campaign.status] ?? campaign.status}
        </span>
        <ArrowUpRight
          aria-hidden
          className="size-5 text-muted transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-fg"
        />
      </div>

      <h2 className="mt-5 text-2xl font-semibold tracking-tight">
        <Link href={`/campaigns/${campaign.slug}`} className="after:absolute after:inset-0">
          {campaign.title}
        </Link>
      </h2>

      <p className="mt-3 line-clamp-3 text-muted">{campaign.summary}</p>

      <dl className="mt-6 space-y-2 border-t border-line pt-4 text-sm text-muted">
        <div className="flex items-center gap-2">
          <CalendarDays aria-hidden className="size-4 shrink-0" />
          <dt className="sr-only">Dates</dt>
          <dd>{campaignDateRange(campaign.starts_on, campaign.ends_on)}</dd>
        </div>
        {campaign.location && (
          <div className="flex items-center gap-2">
            <MapPin aria-hidden className="size-4 shrink-0" />
            <dt className="sr-only">Location</dt>
            <dd>{campaign.location}</dd>
          </div>
        )}
        {fees.length > 0 && (
          <div className="flex items-center gap-2">
            <dt className="sr-only">Fee</dt>
            <dd className="font-mono text-fg">{fees.join(" · ")}</dd>
          </div>
        )}
      </dl>
    </article>
  );
}
