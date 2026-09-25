import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOut } from "@/app/auth/actions";
import { AuthHeader } from "@/components/auth/auth-header";
import { createClient } from "@/lib/supabase/server";
import { getProfileWithInstitution } from "@/lib/queries/profile";
import { INSTITUTION_TYPE_LABEL } from "@/lib/validation/profile";

export const metadata: Metadata = { title: "Your profile | Builder'sCell" };

const date = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const PROVIDER_LABEL: Record<string, string> = { google: "Google", email: "Email code" };

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-line py-4 last:border-0 sm:grid-cols-[13rem_1fr] sm:gap-6">
      <dt className="font-mono text-xs tracking-widest text-muted uppercase">{label}</dt>
      <dd className="text-base text-fg">{value}</dd>
    </div>
  );
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getProfileWithInstitution(user.id);
  if (!profile?.onboarded_at) redirect("/onboarding");

  const institution = profile.institution;
  const providers = (user.identities ?? []).map((i) => PROVIDER_LABEL[i.provider] ?? i.provider);
  const initials = (profile.full_name ?? user.email ?? "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="relative min-h-dvh bg-bg">
      <div aria-hidden className="pointer-events-none absolute inset-0 blueprint [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      <div className="relative">
        <AuthHeader />
      </div>

      <main className="relative mx-auto w-full max-w-2xl px-4 pt-6 pb-20 sm:px-6">
        <div className="flex items-center gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-accent font-semibold text-accent-fg">
            {initials}
          </span>
          <div className="min-w-0">
            <h1 className="display truncate text-3xl sm:text-4xl">{profile.full_name}</h1>
            <p className="truncate text-muted">{profile.email ?? user.email}</p>
          </div>
        </div>

        <dl className="mt-10 rounded-3xl hairline bg-surface/60 px-5 sm:px-7">
          <Row
            label="Institution"
            value={
              institution ? (
                <span>
                  {institution.name}
                  <span className="mt-0.5 block font-mono text-[11px] text-muted">
                    {[
                      INSTITUTION_TYPE_LABEL[institution.type] ?? institution.type,
                      institution.eiin ? `EIIN ${institution.eiin}` : institution.code ? `Code ${institution.code}` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
              ) : (
                <span>
                  {profile.institution_other}
                  <span className="mt-0.5 block font-mono text-[11px] text-muted">Not in our list yet</span>
                </span>
              )
            }
          />
          <Row label="Date of birth" value={profile.dob ? date.format(new Date(profile.dob)) : "—"} />
          <Row label="Phone" value={<span className="font-mono">{profile.phone}</span>} />
          <Row label="Sign-in methods" value={providers.join(", ") || "Email code"} />
          <Row label="Member since" value={date.format(new Date(profile.created_at))} />
        </dl>

        <p className="mt-6 text-sm text-muted">
          Profile editing, kit orders and bootcamp enrolment land here next.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="inline-flex h-11 items-center rounded-full hairline px-5 text-sm font-medium text-fg transition-colors hover:border-line-strong hover:bg-surface"
          >
            Back to the site
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-medium text-muted transition-colors hover:text-signal"
            >
              <LogOut aria-hidden className="size-4" />
              Sign out
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
