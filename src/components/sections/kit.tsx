"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { bdt, kit } from "@/content/site";
import { Button } from "@/components/ui/button";
import { SplitWords } from "@/components/ui/reveal";
import { Scene } from "@/components/three";
import { createKitState } from "@/components/three/bus";
import { DESKTOP, gsap, MOTION_OK, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/cn";

// Scroll positions (0..1) at which each listed part leaves the box; mirrors kit-scene SLOTS.
const PART_AT = [0.18, 0.28, 0.4, 0.52, 0.62, 0.73, 0.82];

export function Kit() {
  const root = useRef<HTMLElement>(null);
  const state = useRef(createKitState());
  const [plan, setPlan] = useState(kit.plans[0].id);
  const active = kit.plans.find((p) => p.id === plan)!;

  useGSAP(
    () => {
      const items = gsap.utils.toArray<HTMLElement>(".kit-part");
      const paint = (p: number) => {
        state.current.progress = p;
        items.forEach((el, i) => el.toggleAttribute("data-on", p >= PART_AT[i] - 0.04));
      };

      const mm = gsap.matchMedia();
      mm.add(`${DESKTOP} and ${MOTION_OK}`, () => {
        ScrollTrigger.create({
          trigger: root.current,
          start: "top top",
          end: "+=180%",
          pin: true,
          scrub: true,
          onUpdate: (s) => paint(s.progress),
        });
      });
      mm.add(`(max-width: 767px) and ${MOTION_OK}`, () => {
        ScrollTrigger.create({
          trigger: ".kit-stage",
          start: "top 75%",
          end: "bottom 20%",
          scrub: true,
          onUpdate: (s) => paint(s.progress),
        });
      });
      // Reduced motion: show the kit fully unpacked.
      mm.add("(prefers-reduced-motion: reduce)", () => paint(1));
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="kit" className="relative bg-bg md:h-svh md:min-h-[720px]">
      <div className="container-x grid h-full gap-6 pt-24 pb-16 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] md:items-center md:pt-20 md:pb-8">
        <div className="relative z-10 order-2 md:order-1">
          <p className="eyebrow mb-4">{kit.eyebrow}</p>
          <h2 className="display text-[clamp(2.4rem,4.6vw,4.4rem)] text-balance">
            <SplitWords text={kit.title} />
          </h2>
          <p data-reveal className="mt-5 max-w-md leading-relaxed text-muted">
            {kit.body}
          </p>

          <ul className="mt-7 grid grid-cols-2 gap-x-6 gap-y-2.5 font-mono text-[13px]">
            {kit.parts.map((p, i) => (
              <li
                key={p.id}
                className="kit-part group flex items-start gap-2.5 text-muted transition-colors duration-500 data-[on]:text-fg"
              >
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-line-strong transition-all duration-500 group-data-[on]:bg-accent group-data-[on]:shadow-[0_0_10px_var(--accent)]" />
                <span>
                  <span className="block leading-tight">
                    <span className="text-muted/70">0{i + 1} </span>
                    {p.name}
                  </span>
                  <span className="text-[11px] text-muted">{p.spec}</span>
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap items-end gap-5">
            <div role="radiogroup" aria-label="Kit plan" className="relative flex rounded-full hairline bg-surface p-1">
              {kit.plans.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={plan === p.id}
                  onClick={() => setPlan(p.id)}
                  className={cn(
                    "relative rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    plan === p.id ? "text-bg" : "text-muted hover:text-fg",
                  )}
                >
                  {plan === p.id && (
                    <motion.span
                      layoutId="plan-pill"
                      className="absolute inset-0 rounded-full bg-fg"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span className="relative">{p.label}</span>
                </button>
              ))}
            </div>
            <div className="min-w-[9rem]">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.p
                  key={active.id}
                  initial={{ y: 16, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -16, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="font-mono text-3xl font-medium tracking-tight"
                >
                  {bdt(active.price)}
                  <span className="ml-2 text-xs text-muted">{active.per}</span>
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Button href={kit.cta.href}>{kit.cta.label}</Button>
            <span className="font-mono text-[11px] text-muted">
              {active.sub} · {kit.note} Prices are placeholders.
            </span>
          </div>
        </div>

        <div className="kit-stage relative order-1 h-[58svh] md:absolute md:inset-y-0 md:right-0 md:h-auto md:w-[62vw]">
          <div aria-hidden className="absolute inset-[8%] rounded-full opacity-50 blur-[80px]" style={{ background: "radial-gradient(circle, var(--glow), transparent 70%)" }} />
          <Scene scene="kit" state={state} className="h-full w-full" />
        </div>
      </div>
    </section>
  );
}
