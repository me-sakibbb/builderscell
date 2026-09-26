"use client";

import { useRef } from "react";
import { bootcamp } from "@/content/site";
import { SectionHeading } from "@/components/ui/reveal";
import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from "@/lib/gsap";

export function Bootcamp() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const items = gsap.utils.toArray<HTMLElement>(".session");
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.fromTo(
          ".trace-fill",
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: { trigger: ".sessions", start: "top 65%", end: "bottom 55%", scrub: true },
          },
        );
        items.forEach((el) =>
          ScrollTrigger.create({
            trigger: el,
            start: "top 62%",
            onEnter: () => el.setAttribute("data-on", ""),
            onLeaveBack: () => el.removeAttribute("data-on"),
          }),
        );
      });
      mm.add("(prefers-reduced-motion: reduce)", () => items.forEach((el) => el.setAttribute("data-on", "")));
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="bootcamp" className="relative bg-bg py-28 sm:py-40">
      <div className="container-x grid gap-16 lg:grid-cols-[1fr_1.1fr]">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <SectionHeading eyebrow={bootcamp.eyebrow} title={bootcamp.title} body={bootcamp.body} />
        </div>

        <ol className="sessions relative">
          <span aria-hidden className="absolute top-2 bottom-2 left-[11px] w-px bg-line-strong">
            <span
              className="trace-fill absolute inset-0 origin-top bg-accent"
              style={{ boxShadow: "0 0 10px var(--accent)" }}
            />
          </span>
          {bootcamp.sessions.map((s) => (
            <li key={s.tag} className="session group relative pb-14 pl-14 last:pb-0">
              <span
                aria-hidden
                className="absolute top-1 left-0 grid size-[23px] place-items-center rounded-full border border-line-strong bg-bg transition-all duration-500 group-data-[on]:border-accent group-data-[on]:shadow-[0_0_24px_var(--glow)]"
              >
                <span className="size-2 rounded-full bg-line-strong transition-colors duration-500 group-data-[on]:bg-accent" />
              </span>
              <p className="label text-muted transition-colors duration-500 group-data-[on]:text-accent-ink">
                {s.tag}
              </p>
              <h3 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{s.title}</h3>
              <p className="mt-3 max-w-md text-lg leading-relaxed text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
