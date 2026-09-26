import type { Metadata } from "next";
import { initialsFrom, requireMember } from "@/lib/queries/profile";
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
      <dt className="label text-muted">{label}</dt>
      <dd className="text-base text-fg">{value}</dd>
    </div>
  );
}

export default async function ProfilePage() {
  const { user, profile } = await requireMember();

  const institution = profile.institution;
  const providers = (user.identities ?? []).map((i) => PROVIDER_LABEL[i.provider] ?? i.provider);
  const name = profile.full_name ?? user.email ?? "Member";

  return (
    <>
      <div className="flex items-center gap-4">
        <span className="grid size-14 shrink-0 place-items-center rounded-full bg-accent font-semibold text-accent-fg">
          {initialsFrom(name)}
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
                <span className="mt-0.5 block text-xs text-muted">Not in our list yet</span>
              </span>
            )
          }
        />
        <Row label="Date of birth" value={profile.dob ? date.format(new Date(profile.dob)) : "—"} />
        <Row label="Phone" value={<span className="font-mono">{profile.phone}</span>} />
        <Row label="Sign-in methods" value={providers.join(", ") || "Email code"} />
        <Row label="Member since" value={date.format(new Date(profile.created_at))} />
      </dl>

      <p className="mt-10 text-sm text-muted">Profile editing and kit orders land here next.</p>
    </>
  );
}
