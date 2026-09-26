import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PROTECTED = ["/dashboard", "/profile", "/onboarding", "/admin"];

/** Campaign pages are public; their registration form is not. */
const PROTECTED_PATTERNS = [/^\/campaigns\/[^/]+\/register\/?$/];

const isProtected = (pathname: string) =>
  PROTECTED.some((p) => pathname.startsWith(p)) || PROTECTED_PATTERNS.some((p) => p.test(pathname));

/**
 * Keeps the Supabase session cookie fresh on every navigation and bounces signed-out
 * visitors away from member pages. This is an optimistic check only - every page and
 * action re-checks the user server-side.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        },
      },
    },
  );

  // Do not remove: this refreshes the session and is what writes the cookies above.
  const { data } = await supabase.auth.getClaims();
  const { pathname } = request.nextUrl;

  if (!data?.claims && isProtected(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = pathname === "/dashboard" ? "" : `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  if (data?.claims && (pathname === "/login" || pathname === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|models|images|.*\.(?:svg|png|jpg|jpeg|gif|webp|glb|hdr)$).*)"],
};
