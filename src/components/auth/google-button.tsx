"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/** Google's mark, inlined so the button works offline and in both themes. */
function GoogleMark() {
  return (
    <svg aria-hidden viewBox="0 0 48 48" className="size-5">
      <path fill="var(--google-blue)" d="M45.1 24.5c0-1.6-.1-3.2-.4-4.7H24v8.9h11.8a10.1 10.1 0 0 1-4.4 6.6v5.5h7.1c4.2-3.8 6.6-9.5 6.6-16.3z" />
      <path fill="var(--google-green)" d="M24 46c6 0 11-2 14.5-5.2l-7.1-5.5c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.6-3.9-12.3-9.1H4.3v5.7A22 22 0 0 0 24 46z" />
      <path fill="var(--google-yellow)" d="M11.7 28.3a13.2 13.2 0 0 1 0-8.6v-5.7H4.3a22 22 0 0 0 0 20l7.4-5.7z" />
      <path fill="var(--google-red)" d="M24 9.5c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 2.9 30 1 24 1A22 22 0 0 0 4.3 14l7.4 5.7C13.4 13.4 18.3 9.5 24 9.5z" />
    </svg>
  );
}

export function GoogleButton({ next = "/dashboard", label = "Continue with Google" }: { next?: string; label?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) {
      setBusy(false);
      setError(
        error.message.toLowerCase().includes("provider is not enabled")
          ? "Google sign-in isn't switched on yet. Use your email for now."
          : error.message,
      );
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={start}
        disabled={busy}
        className="flex h-12 w-full items-center justify-center gap-3 rounded-xl hairline bg-surface text-sm font-medium text-fg transition-colors hover:border-line-strong hover:bg-bg-elev disabled:opacity-60"
      >
        <GoogleMark />
        {busy ? "Opening Google…" : label}
      </button>
      {error && (
        <p role="alert" className="text-sm text-signal">
          {error}
        </p>
      )}
    </div>
  );
}
