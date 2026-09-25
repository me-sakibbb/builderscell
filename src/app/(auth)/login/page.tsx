import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard, OrDivider } from "@/components/auth/auth-card";
import { GoogleButton } from "@/components/auth/google-button";
import { OtpForm } from "@/components/auth/otp-form";
import { safeNext } from "@/lib/auth";

export const metadata: Metadata = { title: "Sign in | Builder'sCell" };

export default async function LoginPage(props: PageProps<"/login">) {
  const { next } = await props.searchParams;
  const target = safeNext(typeof next === "string" ? next : null);

  return (
    <AuthCard
      eyebrow="Members"
      title="Sign in to Builder'sCell"
      lead="Use the email you signed up with, or your Google account."
      footer={
        <>
          New here?{" "}
          <Link href="/signup" className="font-medium text-fg underline-offset-4 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <OtpForm intent="login" next={target} />
      <OrDivider />
      <GoogleButton next={target} />
    </AuthCard>
  );
}
