import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ReviewForm } from "@/components/admin/review-form";
import { RegistrationSummary } from "@/components/registration/registration-summary";
import { getRegistrationWithMembers } from "@/lib/queries/registrations";

export const metadata: Metadata = { title: "Review registration | Builders' Cell admin" };

const dateTime = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function AdminRegistrationPage({ params }: PageProps<"/admin/registrations/[id]">) {
  const { id } = await params;
  const registration = await getRegistrationWithMembers(id);
  if (!registration || registration.status === "draft") notFound();

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link
        href="/admin/registrations"
        className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-fg"
      >
        <ArrowLeft aria-hidden className="size-4" />
        All registrations
      </Link>

      <h1 className="display mt-6 text-3xl sm:text-4xl">{registration.campaign?.title}</h1>
      <p className="mt-2 text-muted">
        {registration.type === "team" ? `Team of ${registration.member_count}` : "Individual"}
        {registration.reviewed_at ? ` · reviewed ${dateTime.format(new Date(registration.reviewed_at))}` : ""}
      </p>

      <div className="mt-8">
        <RegistrationSummary registration={registration} />
      </div>

      <div className="mt-8">
        <ReviewForm registrationId={registration.id} status={registration.status} />
      </div>
    </div>
  );
}
