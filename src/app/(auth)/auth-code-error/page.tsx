import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";

export const metadata: Metadata = { title: "Sign-in failed | Builder'sCell" };

export default function AuthCodeErrorPage() {
  return (
    <AuthCard
      eyebrow="Something broke"
      title="That sign-in didn't go through"
      lead="The link may have expired, already been used, or been opened in a different browser. Starting again usually fixes it."
    >
      <Link
        href="/login"
        className="flex h-12 w-full items-center justify-center rounded-xl bg-fg text-sm font-medium text-bg transition-colors hover:bg-accent hover:text-accent-fg"
      >
        Back to sign in
      </Link>
    </AuthCard>
  );
}
