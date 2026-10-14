import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard, OrDivider } from "@/components/auth/auth-card";
import { GoogleButton } from "@/components/auth/google-button";
import { SignupForm } from "@/components/auth/signup-form";
import { safeNext } from "@/lib/auth";

export const metadata: Metadata = { title: "Create an account | Builders' Cell" };

export default async function SignupPage(props: PageProps<"/signup">) {
  const { next } = await props.searchParams;
  const target = safeNext(typeof next === "string" ? next : null);

  return (
    <AuthCard
      eyebrow="Join the cell"
      title="Create your account"
      lead="Pick a password, then confirm your email with a 6-digit code. Details come next."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-fg underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <SignupForm next={target} />
      <OrDivider />
      <GoogleButton next={target} label="Sign up with Google" />
    </AuthCard>
  );
}
