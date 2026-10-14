import type { Metadata } from "next";
import { CampaignCard } from "@/components/campaigns/campaign-card";
import { Pagination } from "@/components/ui/pagination";
import { listCampaigns } from "@/lib/queries/campaigns";
import { getCampaignOffers } from "@/lib/queries/coupons";

export const metadata: Metadata = {
  title: "Campaigns | Builders' Cell",
  description: "Bootcamps, workshops and competitions you can register for at Builders' Cell.",
};

export default async function CampaignsPage({ searchParams }: PageProps<"/campaigns">) {
  const params = await searchParams;
  const page = Number(Array.isArray(params.page) ? params.page[0] : params.page) || 1;
  const { items, page: current, pageCount, total } = await listCampaigns(page);
  const offers = await getCampaignOffers(items.map((campaign) => campaign.id));

  return (
    <>
      <header className="max-w-2xl">
        <p className="eyebrow">Campaigns</p>
        <h1 className="display mt-6 text-[clamp(2.4rem,6vw,4.5rem)]">Everything you can join</h1>
        <p className="mt-5 text-lg text-muted">
          Bootcamps, workshops and competitions run by Builders&apos; Cell. Pick one to see what it covers and how to
          register.
        </p>
      </header>

      {items.length === 0 ? (
        <p className="mt-16 rounded-3xl hairline bg-surface/60 px-6 py-10 text-center text-muted">
          Nothing is open right now. Check back soon.
        </p>
      ) : (
        <>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} offers={offers[campaign.id]} />
            ))}
          </div>

          <Pagination
            className="mt-12"
            page={current}
            pageCount={pageCount}
            hrefFor={(target) => (target <= 1 ? "/campaigns" : `/campaigns?page=${target}`)}
            label={`${total} campaigns`}
          />
        </>
      )}
    </>
  );
}
