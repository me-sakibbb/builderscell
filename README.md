# Builder's Cell

Landing page for Builder's Cell, a robotics community in Bangladesh (bootcamp, nine-month lab, parts shop).

```bash
npm install
npm run dev     # http://localhost:3000
npm run build
```

## Where things live

| Path | What |
| --- | --- |
| `src/content/site.ts` | All copy, prices, dates, links. Values marked `DUMMY` are placeholders. |
| `src/components/sections/` | One file per page section, in page order in `src/app/page.tsx`. |
| `src/components/three/` | 3D scenes (hero robot, kit exploded view, playground rover) and procedural parts. |
| `src/app/globals.css` | Theme tokens for light and dark, shared utilities. |
| `public/models`, `public/images` | Third-party assets, all listed with licenses in `CREDITS.md`. |
| `src/app/(auth)/` | Sign in, sign up and the post-verification details form, on their own minimal layout. |
| `src/app/profile/` | Member profile (read-only for now). |
| `src/app/auth/` | Server actions for the auth flows and the Google OAuth callback. |
| `src/lib/supabase/` | Browser and server Supabase clients, plus generated database types. |
| `src/lib/queries/` | Every database read and write, so components and actions never build queries inline. |
| `src/hooks/` | Client-side data fetching and stateful logic (e.g. the paginated institution search). |
| `src/proxy.ts` | Session refresh and the optimistic guard on member pages (Next 16's renamed middleware). |
| `supabase/migrations/` | The applied migrations, in order. Keep a file here for every change. |
| `scripts/configure-supabase-auth.mjs` | Re-applies the project's auth settings (OTP, SMTP, templates, Google). |

## Accounts

Supabase Auth. Two ways in, one account per email address (Supabase links the identities when the
Google address is verified):

- **Email** — `signInWithOtp` mails a 6-digit code, `verifyOtp` exchanges it for a session.
  `/signup` creates users, `/login` refuses unknown addresses.
- **Google** — PKCE round trip through `/auth/callback`.

Either way, a first-time user lands on `/onboarding` to give their name, institution, date of birth
and phone number; `profiles.onboarded_at` is what marks that done, and every entry point re-checks it.

Two tables, both with RLS on: `institutions` (~32k rows, world-readable, searched and paged in
Postgres through `search_institutions(q, lim, off)` behind the `useInstitutionSearch` hook) and `profiles` (a row per `auth.users` row, created by the
`on_auth_user_created` trigger, readable and writable only by its owner). Phone numbers are stored
normalised as `+8801XXXXXXXXX`; picking "Other" in the institution dropdown stores free text in
`profiles.institution_other` instead of a foreign key.

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_ACCESS_TOKEN=...   # management API + type generation only, never shipped to the browser

# regenerate src/lib/supabase/types.ts after a migration
curl -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN"   "https://api.supabase.com/v1/projects/<ref>/types/typescript?included_schemas=public"
```

Email goes out over Brevo SMTP, which is not optional: Supabase's built-in sender is capped at
2 messages/hour and its free-tier templates cannot be edited, so it can only send a magic link,
never a 6-digit code. Sign-in emails are therefore sent from a Brevo verified sender, with the code
in a themed template (`scripts/configure-supabase-auth.mjs` holds both). Deliverability note: the
sender is a gmail.com address, which cannot be DKIM-signed for our domain — move it to a Builder's
Cell domain when one exists, or expect a share of mail to land in spam.

## How the 3D works

There is one WebGL canvas for the whole page (`three/canvas-root.tsx`), fixed behind the content at `z-index: 5`. Sections place a `<Scene>` box and drei's `<View>` renders into just that rectangle, skipping it when off-screen.

Because the canvas is a single layer, anything that must sit **on top** of a 3D scene needs its own stacking context above z-5 (the hero is `z-[6]`; the playground HUD is `z-10` inside a container with no transform). Scroll progress and controls reach the scenes through refs, not React state.

## Stack

Next.js 16 (App Router), Tailwind CSS v4, lucide-react, three.js with @react-three/fiber and drei, GSAP ScrollTrigger, Lenis, Motion, next-themes.
