import Link from "next/link";
import { Wordmark } from "@/components/ui/wordmark";
import { ThemeToggle } from "@/components/ui/theme-toggle";

/** Stripped-back header for the account pages: no nav, no 3D, just a way home. */
export function AuthHeader() {
  return (
    <header className="flex items-center justify-between px-4 py-4 sm:px-8">
      <Link href="/" className="text-xl" aria-label="Builder's Cell home">
        <Wordmark />
      </Link>
      <ThemeToggle />
    </header>
  );
}
