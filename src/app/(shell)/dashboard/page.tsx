import type { Metadata } from "next";
import Link from "next/link";
import { CampaignCard } from "@/components/campaigns/campaign-card";
import { listCampaigns } from "@/lib/queries/campaigns";
import { getCampaignOffers } from "@/lib/queries/coupons";
import { requireMember } from "@/lib/queries/profile";

export const metadata: Metadata = { title: "Dashboard | Builders' Cell" };

/** A preview only. The full, paginated list lives at /campaigns. */
const PREVIEW_COUNT = 6;

export default async function DashboardPage() {
  const { profile } = await requireMember();
  const { items, total } = await listCampaigns(1, PREVIEW_COUNT);
  const offers = await getCampaignOffers(items.map((campaign) => campaign.id));

  const firstName = (profile.full_name ?? "").split(/\s+/)[0] || "builder";

  return (
    <>
      <h1 className="display text-[clamp(2.2rem,5vw,3.4rem)]">Welcome back, {firstName}</h1>

      <section className="mt-14">
        <div className="flex items-baseline justify-between gap-4 border-b border-line pb-4">
          <h2 className="label text-muted">Campaigns</h2>
          {total > items.length && (
            <Link href="/campaigns" className="text-sm text-muted transition-colors hover:text-fg">
              All {total}
            </Link>
          )}
        </div>

        {items.length === 0 ? (
          <p className="mt-8 rounded-3xl hairline bg-surface/60 px-6 py-10 text-center text-muted">
            Nothing is open right now. Check back soon.
          </p>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} offers={offers[campaign.id]} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
