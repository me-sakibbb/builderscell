import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { ResetForm } from "@/components/auth/reset-form";
import { safeNext } from "@/lib/auth";

export const metadata: Metadata = { title: "Reset your password | Builders' Cell" };

export default async function ForgotPasswordPage(props: PageProps<"/forgot-password">) {
  const { next } = await props.searchParams;
  const target = safeNext(typeof next === "string" ? next : null);

  return (
    <AuthCard
      eyebrow="Members"
      title="Reset your password"
      lead="Enter your account email. We'll send a 6-digit code so you can pick a new password."
      footer={
        <>
          Remembered it?{" "}
          <Link
            href={`/login?next=${encodeURIComponent(target)}`}
            className="font-medium text-fg underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <ResetForm next={target} />
    </AuthCard>
  );
}
