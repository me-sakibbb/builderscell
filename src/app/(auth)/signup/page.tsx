import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard, OrDivider } from "@/components/auth/auth-card";
import { GoogleButton } from "@/components/auth/google-button";
import { OtpForm } from "@/components/auth/otp-form";
import { safeNext } from "@/lib/auth";

export const metadata: Metadata = { title: "Create an account | Builder'sCell" };

export default async function SignupPage(props: PageProps<"/signup">) {
  const { next } = await props.searchParams;
  const target = safeNext(typeof next === "string" ? next : null);

  return (
    <AuthCard
      eyebrow="Join the cell"
      title="Create your account"
      lead="We'll send a 6-digit code to your email. Details come next."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-fg underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <OtpForm intent="signup" next={target} />
      <OrDivider />
      <GoogleButton next={target} label="Sign up with Google" />
    </AuthCard>
  );
}
