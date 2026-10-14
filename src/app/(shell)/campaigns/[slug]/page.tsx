import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays, GraduationCap, MapPin } from "lucide-react";
import { campaignDateRange } from "@/components/campaigns/campaign-card";
import { Button } from "@/components/ui/button";
import { bdt } from "@/content/site";
import {
  campaignFeeLines,
  campaignHighlights,
  campaignPaymentNumbers,
  getCampaignBySlug,
  isCampaignFull,
  registrationWindow,
} from "@/lib/queries/campaigns";
import { PAYMENT_METHOD_LABEL, type PaymentMethod } from "@/lib/validation/registration";

export async function generateMetadata({ params }: PageProps<"/campaigns/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const campaign = await getCampaignBySlug(slug);
  if (!campaign) return { title: "Campaign | Builders' Cell" };

  return {
    title: `${campaign.title} | Builders' Cell`,
    description: campaign.summary,
  };
}

export default async function CampaignPage({ params }: PageProps<"/campaigns/[slug]">) {
  const { slug } = await params;
  const campaign = await getCampaignBySlug(slug);
  if (!campaign) notFound();

  const window = registrationWindow(campaign);
  const full = window.open ? await isCampaignFull(campaign.id) : false;
  const highlights = campaignHighlights(campaign.highlights);
  const feeLines = campaignFeeLines(campaign.fee_lines);
  const numbers = campaignPaymentNumbers(campaign.payment_numbers);

  const meta = [
    { icon: CalendarDays, label: "Dates", value: campaignDateRange(campaign.starts_on, campaign.ends_on) },
    campaign.location ? { icon: MapPin, label: "Where", value: campaign.location } : null,
    campaign.min_class_level || campaign.max_class_level
      ? {
          icon: GraduationCap,
          label: "Who",
          value: `Class ${campaign.min_class_level ?? 1} to ${campaign.max_class_level ?? 12}`,
        }
      : null,
  ].filter((row) => row !== null);

  return (
    <div className="relative mx-auto max-w-3xl">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-56 left-1/2 size-[70vmin] -translate-x-1/2 rounded-full opacity-60 blur-[110px]"
        style={{ background: "radial-gradient(circle, var(--glow), transparent 65%)" }}
      />
      <div className="relative">
          <p className="eyebrow">{campaign.eyebrow ?? "Campaign"}</p>
          <h1 className="display mt-6 text-[clamp(2.4rem,6vw,4.5rem)] text-balance">{campaign.title}</h1>
          <p className="mt-6 text-lg leading-relaxed text-muted">{campaign.summary}</p>

          {campaign.description && (
            <p className="mt-5 leading-relaxed text-muted">{campaign.description}</p>
          )}

          {meta.length > 0 && (
            <dl className="mt-10 grid gap-4 sm:grid-cols-3">
              {meta.map((row) => (
                <div key={row.label} className="rounded-2xl hairline bg-surface/60 p-4">
                  <dt className="flex items-center gap-2 label-xs text-muted">
                    <row.icon aria-hidden className="size-3.5" />
                    {row.label}
                  </dt>
                  <dd className="mt-2 text-sm text-fg">{row.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {feeLines.length > 0 && (
            <section className="mt-12">
              <h2 className="label text-muted">Registration fee</h2>
              <ul className="mt-4 divide-y divide-line border-y border-line">
                {feeLines.map((line) => (
                  <li key={line.label} className="flex items-baseline justify-between gap-4 py-4">
                    <span>
                      <span className="block text-base text-fg">{line.label}</span>
                      {line.note && <span className="mt-0.5 block text-sm text-muted">{line.note}</span>}
                    </span>
                    <span className="shrink-0 font-mono text-base text-fg">{bdt(line.amount)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {highlights.length > 0 && (
            <section className="mt-12">
              <h2 className="label text-muted">How it works</h2>
              <ol className="mt-4 space-y-4">
                {highlights.map((item, index) => (
                  <li key={item.title} className="flex gap-4 rounded-2xl hairline bg-surface/60 p-5">
                    <span className="font-mono text-sm text-accent-ink">{String(index + 1).padStart(2, "0")}</span>
                    <span>
                      <span className="block text-base font-medium text-fg">{item.title}</span>
                      <span className="mt-1 block text-sm leading-relaxed text-muted">{item.body}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {(campaign.payment_instructions || numbers.length > 0) && (
            <section className="mt-12 rounded-2xl hairline bg-surface/60 p-5">
              <h2 className="label text-muted">Paying the fee</h2>
              {campaign.payment_instructions && (
                <p className="mt-3 text-sm leading-relaxed text-muted">{campaign.payment_instructions}</p>
              )}
              {numbers.length > 0 && (
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {numbers.map((entry) => (
                    <li key={`${entry.method}-${entry.number}`} className="rounded-xl hairline bg-bg-elev px-4 py-3">
                      <span className="block label-xs text-muted">
                        {PAYMENT_METHOD_LABEL[entry.method as PaymentMethod] ?? entry.method}
                      </span>
                      <span className="mt-1 block font-mono text-base text-fg">{entry.number}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          <div className="mt-12 flex flex-wrap items-center gap-4">
            {window.open && !full ? (
              <Button href={`/campaigns/${campaign.slug}/register`} size="lg">
                Register now
              </Button>
            ) : (
              <p className="rounded-xl hairline bg-surface px-5 py-4 text-sm text-muted">
                {full ? "Every seat for this campaign is taken." : window.reason}
              </p>
            )}
            <Button href="/campaigns" size="lg" variant="ghost" arrow={false}>
              All campaigns
            </Button>
          </div>
      </div>
    </div>
  );
}
