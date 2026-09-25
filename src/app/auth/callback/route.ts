import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/auth";
import { destinationFor } from "@/lib/queries/profile";

/** Lands the Google (PKCE) round trip: swap the code for a session, then route on. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  // Behind Vercel's load balancer the request origin is the internal host.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const base = process.env.NODE_ENV === "development" || !forwardedHost ? origin : `https://${forwardedHost}`;

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      return NextResponse.redirect(`${base}${await destinationFor(data.user.id, next)}`);
    }
  }

  return NextResponse.redirect(`${base}/auth-code-error`);
}
