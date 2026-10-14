import Link from "next/link";
import { ArrowUpRight, CalendarDays, MapPin } from "lucide-react";
import { OfferNotes, OfferPrice } from "@/components/campaigns/offer";
import { bdt } from "@/content/site";
import { CAMPAIGN_STATUS_LABEL, type CampaignCard as CampaignCardData } from "@/lib/queries/campaigns";
import type { CampaignOffers } from "@/lib/validation/coupon";
import { cn } from "@/lib/cn";

const day = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });

export function campaignDateRange(startsOn: string | null, endsOn: string | null) {
  if (!startsOn && !endsOn) return "Dates to be announced";
  if (startsOn && endsOn) return `${day.format(new Date(startsOn))} — ${day.format(new Date(endsOn))}`;
  return day.format(new Date((startsOn ?? endsOn) as string));
}

export function CampaignCard({ campaign, offers }: { campaign: CampaignCardData; offers?: CampaignOffers }) {
  const fees = [
    campaign.allows_individual && campaign.individual_fee_bdt !== null
      ? { key: "solo", label: "Individual", listed: campaign.individual_fee_bdt, offer: offers?.individual }
      : null,
    campaign.allows_team && campaign.team_fee_bdt !== null
      ? { key: "team", label: "Team", listed: campaign.team_fee_bdt, offer: offers?.team }
      : null,
  ].filter((fee) => fee !== null);
  const hasOffer = fees.some((fee) => fee.offer);

  return (
    <article className="group relative flex h-full flex-col rounded-3xl hairline bg-surface/60 p-6 transition-colors hover:border-line-strong">
      <div className="flex items-center justify-between gap-3">
        <span
          className={cn(
            "inline-flex h-7 items-center rounded-full border px-3 label-xs",
            campaign.status === "open" ? "border-accent bg-accent/10 text-accent-ink" : "border-line text-muted",
          )}
        >
          {CAMPAIGN_STATUS_LABEL[campaign.status] ?? campaign.status}
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
        {fees.length > 0 && !hasOffer && (
          <div className="flex items-center gap-2">
            <dt className="sr-only">Fee</dt>
            <dd className="font-mono text-fg">
              {fees.map((fee) => `${bdt(fee.listed)} ${fee.key}`).join(" · ")}
            </dd>
          </div>
        )}
        {/* With an offer, each fee gets its own row so the price and saving have room. */}
        {fees.length > 0 && hasOffer && (
          <div>
            <dt className="sr-only">Fee</dt>
            <dd className="space-y-2">
              {fees.map((fee) => (
                <div key={fee.key} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <span className="label-xs text-muted">{fee.label}</span>
                  <OfferPrice listed={fee.listed} offer={fee.offer} className="text-fg" />
                </div>
              ))}
            </dd>
          </div>
        )}
      </dl>

      <OfferNotes offers={offers} className="mt-4" />
    </article>
  );
}
