"use client";

import { useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import { join } from "@/content/site";
import { Button } from "@/components/ui/button";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";

const fmt = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" });

export function Join() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        // The closing line scales up out of the page as it arrives.
        gsap.fromTo(
          ".join-title",
          { scale: 0.82, opacity: 0.2 },
          {
            scale: 1,
            opacity: 1,
            ease: "none",
            scrollTrigger: { trigger: root.current, start: "top 90%", end: "top 20%", scrub: true },
          },
        );
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="join" className="relative overflow-hidden bg-bg py-28 sm:py-40">
      <div aria-hidden className="absolute inset-0 blueprint [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <div
        aria-hidden
        className="absolute top-1/3 left-1/2 size-[80vmin] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70 blur-[100px]"
        style={{ background: "radial-gradient(circle, var(--glow), transparent 65%)" }}
      />
      <div className="relative container-x text-center">
        <p data-reveal className="eyebrow mb-8">
          {join.eyebrow}
        </p>
        <h2 className="join-title display mx-auto max-w-[16ch] origin-bottom text-[clamp(2.8rem,8vw,7.5rem)] text-balance">
          {join.title}
        </h2>
        <p data-reveal className="mx-auto mt-8 max-w-lg text-lg text-muted">
          {join.body}
        </p>
        <div data-reveal className="mt-10 flex flex-wrap justify-center gap-3">
          <Button href={join.primary.href} size="lg">
            {join.primary.label}
          </Button>
          <Button href={join.secondary.href} size="lg" variant="ghost" arrow={false}>
            {join.secondary.label}
          </Button>
        </div>

        <div data-reveal className="mx-auto mt-24 max-w-3xl text-left">
          <div className="mb-4 flex items-baseline justify-between">
            <h3 className="font-mono text-xs tracking-widest text-muted uppercase">Upcoming Inspire Sessions</h3>
            <span className="font-mono text-[11px] text-muted">Dates are placeholders</span>
          </div>
          <ul className="divide-y divide-line border-y border-line">
            {join.sessions.map((s) => (
              <li key={s.date}>
                <a
                  href="#"
                  className="group grid grid-cols-[5.5rem_1fr_auto] items-center gap-4 py-5 transition-colors hover:text-accent-ink sm:grid-cols-[7rem_1fr_1fr_auto]"
                >
                  <span className="font-mono text-sm">{fmt.format(new Date(s.date))}</span>
                  <span className="text-xl font-medium tracking-tight">{s.city}</span>
                  <span className="hidden text-muted sm:block">{s.venue}</span>
                  <ArrowUpRight className="size-5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
