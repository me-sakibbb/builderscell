import type { Metadata } from "next";
import Link from "next/link";
import { MyRegistrations } from "@/components/registration/my-registrations";
import { requireMember } from "@/lib/queries/profile";

export const metadata: Metadata = { title: "Your registrations | Builder'sCell" };

export default async function RegistrationsPage({ searchParams }: PageProps<"/dashboard/registrations">) {
  const params = await searchParams;
  const page = Number(Array.isArray(params.page) ? params.page[0] : params.page) || 1;

  const { user } = await requireMember();

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Registrations</p>
          <h1 className="display mt-6 text-[clamp(2.2rem,5vw,3.4rem)]">Everything you have joined</h1>
        </div>
        <Link
          href="/campaigns"
          className="inline-flex h-11 items-center rounded-full hairline px-5 text-sm font-medium text-fg transition-colors hover:border-line-strong hover:bg-surface"
        >
          Browse campaigns
        </Link>
      </header>

      <div className="mt-12">
        <MyRegistrations userId={user.id} page={page} basePath="/dashboard/registrations" />
      </div>
    </>
  );
}
