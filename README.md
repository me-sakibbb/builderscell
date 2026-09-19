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

## How the 3D works

There is one WebGL canvas for the whole page (`three/canvas-root.tsx`), fixed behind the content at `z-index: 5`. Sections place a `<Scene>` box and drei's `<View>` renders into just that rectangle, skipping it when off-screen.

Because the canvas is a single layer, anything that must sit **on top** of a 3D scene needs its own stacking context above z-5 (the hero is `z-[6]`; the playground HUD is `z-10` inside a container with no transform). Scroll progress and controls reach the scenes through refs, not React state.

## Stack

Next.js 16 (App Router), Tailwind CSS v4, lucide-react, three.js with @react-three/fiber and drei, GSAP ScrollTrigger, Lenis, Motion, next-themes.
