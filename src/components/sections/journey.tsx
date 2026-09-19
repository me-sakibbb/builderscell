"use client";

import { useRef } from "react";
import { Box, Cpu, GraduationCap, Megaphone, Rocket } from "lucide-react";
import { journey } from "@/content/site";
import { SplitWords } from "@/components/ui/reveal";
import { DESKTOP, gsap, MOTION_OK, useGSAP } from "@/lib/gsap";

const ICONS = [Megaphone, Box, Cpu, GraduationCap, Rocket];

export function Journey() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(`${DESKTOP} and ${MOTION_OK}`, () => {
        const el = track.current!;
        const distance = () => el.scrollWidth - window.innerWidth;
        const nodes = gsap.utils.toArray<HTMLElement>(".j-node");
        const wires = gsap.utils.toArray<HTMLElement>(".j-wire");
        gsap.set(nodes, { "--on": 0 });
        gsap.set(wires, { scaleX: 0 });

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: () => "+=" + distance(),
            pin: true,
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        });
        tl.to(el, { x: () => -distance(), duration: 1 }, 0);
        // Current flows node to node: each node powers on, then its wire fills.
        const step = 1 / nodes.length;
        nodes.forEach((node, i) => {
          // fromTo, not to: invalidateOnRefresh re-reads start values, which may
          // already be "on" if the refresh rendered the timeline at its end.
          tl.fromTo(node, { "--on": 0 }, { "--on": 1, duration: step * 0.2 }, i * step * 0.9);
          if (wires[i])
            tl.fromTo(wires[i], { scaleX: 0 }, { scaleX: 1, duration: step * 0.8 }, i * step * 0.9 + step * 0.1);
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="journey"
      className="relative overflow-hidden bg-bg-elev py-24 md:flex md:h-svh md:items-center md:py-0"
    >
      <div aria-hidden className="absolute inset-0 blueprint opacity-60" />
      <div
        ref={track}
        className="relative flex flex-col gap-14 px-4 sm:px-8 md:w-max md:flex-row md:items-start md:gap-0 md:px-0"
      >
        <div className="shrink-0 md:w-[46vw] md:pr-16 md:pl-[max(2rem,calc((100vw-1280px)/2+2rem))]">
          <p className="eyebrow mb-5">{journey.eyebrow}</p>
          <h2 className="display text-[clamp(2.6rem,5.8vw,5.4rem)] text-balance">
            <SplitWords text={journey.title} />
          </h2>
          <p className="mt-6 hidden font-mono text-xs text-muted md:block">Keep scrolling →</p>
        </div>

        {journey.steps.map((s, i) => {
          const Icon = ICONS[i];
          const last = i === journey.steps.length - 1;
          return (
            <article
              key={s.id}
              className="j-node relative shrink-0 border-l border-line pl-6 [--on:1] md:mt-4 md:w-[30vw] md:border-l-0 md:pr-10 md:pl-0"
            >
              <div className="relative mb-8 flex items-center gap-4">
                <span
                  className="relative z-10 grid size-14 shrink-0 place-items-center rounded-2xl border bg-bg"
                  style={{
                    borderColor: "color-mix(in oklab, var(--accent) calc(var(--on) * 100%), var(--line-strong))",
                    boxShadow:
                      "0 0 calc(var(--on) * 36px) color-mix(in oklab, var(--glow) calc(var(--on) * 100%), transparent)",
                  }}
                >
                  <Icon
                    className="size-6"
                    style={{ color: "color-mix(in oklab, var(--accent-ink) calc(var(--on) * 100%), var(--muted))" }}
                  />
                </span>
                <span className="font-mono text-sm text-muted">{s.tag}</span>
                {!last && (
                  <span aria-hidden className="absolute top-1/2 left-14 hidden h-px w-[calc(30vw-3.5rem)] bg-line-strong md:block">
                    <span
                      className="j-wire absolute inset-0 origin-left bg-accent"
                      style={{ boxShadow: "0 0 8px var(--accent)" }}
                    />
                  </span>
                )}
              </div>
              <h3 className="mb-3 text-3xl font-semibold tracking-tight sm:text-4xl">{s.title}</h3>
              <p className="max-w-sm text-lg leading-relaxed text-muted">{s.body}</p>
            </article>
          );
        })}
        <div className="hidden w-[10vw] shrink-0 md:block" />
      </div>
    </section>
  );
}
