"use client";

import { useRef } from "react";
import { marquee, numbers } from "@/content/site";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";

export function Numbers() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.utils.toArray<HTMLElement>(".num").forEach((el) => {
          const target = Number(el.dataset.value);
          const pad = Number(el.dataset.pad);
          const o = { v: 0 };
          gsap.to(o, {
            v: target,
            duration: 1.6,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 85%", once: true },
            onUpdate: () => {
              el.textContent = String(Math.round(o.v)).padStart(pad, "0");
            },
          });
        });
        gsap.from(".num-rule", {
          scaleX: 0,
          transformOrigin: "left",
          duration: 1.4,
          ease: "expo.out",
          stagger: 0.1,
          scrollTrigger: { trigger: root.current, start: "top 80%", once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  const loop = [...marquee, ...marquee];

  return (
    <section ref={root} id="numbers" className="relative z-10 bg-bg pt-24 sm:pt-32">
      <div className="container-x grid gap-12 sm:grid-cols-3 sm:gap-8">
        {numbers.map((n) => (
          <div key={n.label}>
            <div className="num-rule mb-6 h-px bg-line-strong" />
            <p className="flex items-start font-mono text-[clamp(4.5rem,11vw,9rem)] leading-none font-medium tracking-tighter">
              <span className="num" data-value={n.value} data-pad={n.pad}>
                {String(n.value).padStart(n.pad, "0")}
              </span>
            </p>
            <p data-reveal className="mt-4 max-w-[26ch] text-muted">
              {n.label}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-24 overflow-hidden border-y border-line py-6 sm:mt-32" aria-hidden>
        <div className="animate-marquee flex w-max">
          {loop.map((w, i) => (
            <span key={i} className="flex items-center text-[clamp(2.5rem,6vw,5rem)] font-semibold tracking-tight">
              <span className={i % 3 === 1 ? "text-accent" : "text-fg/90"}>{w}</span>
              <span className="mx-8 inline-block size-3 rounded-full border-2 border-line-strong sm:mx-12" />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
