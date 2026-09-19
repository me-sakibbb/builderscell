"use client";

import { useRef } from "react";
import Image from "next/image";
import { cell } from "@/content/site";
import { SectionHeading } from "@/components/ui/reveal";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";

// Each photo drifts at its own speed for depth.
const LAYERS = [
  { cls: "left-0 top-0 w-[70%] aspect-[4/3]", speed: -8 },
  { cls: "right-0 top-[30%] w-[52%] aspect-[16/10]", speed: -22 },
  { cls: "left-[10%] bottom-[2%] w-[48%] aspect-[3/2]", speed: -38 },
];

export function Cell() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.utils.toArray<HTMLElement>(".plx").forEach((el) => {
          gsap.fromTo(
            el,
            { yPercent: 0 },
            {
              yPercent: Number(el.dataset.speed),
              ease: "none",
              scrollTrigger: { trigger: ".plx-stage", start: "top bottom", end: "bottom top", scrub: true },
            },
          );
          gsap.fromTo(
            el.querySelector("img"),
            { scale: 1.25 },
            {
              scale: 1,
              ease: "none",
              scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
            },
          );
        });
        gsap.from(".spec-row", {
          clipPath: "inset(0 100% 0 0)",
          duration: 1.1,
          ease: "expo.out",
          stagger: 0.08,
          scrollTrigger: { trigger: ".specs", start: "top 80%", once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="cell" className="relative overflow-hidden bg-bg-elev py-28 sm:py-40">
      <div aria-hidden className="absolute inset-0 blueprint opacity-50" />
      <div className="relative container-x">
        <SectionHeading eyebrow={cell.eyebrow} title={cell.title} body={cell.body} titleClassName="max-w-[16ch]" />

        <div className="mt-20 grid gap-16 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div className="plx-stage relative h-[520px] sm:h-[640px]">
            {cell.images.map((img, i) => (
              <div
                key={img.src}
                data-speed={LAYERS[i].speed}
                className={`plx absolute overflow-hidden rounded-3xl hairline shadow-2xl shadow-black/20 ${LAYERS[i].cls}`}
              >
                <Image src={img.src} alt={img.alt} fill sizes="(min-width: 1024px) 40vw, 80vw" className="object-cover" />
              </div>
            ))}
            <div className="plx absolute right-[6%] bottom-[12%] z-10 rounded-2xl glass hairline px-4 py-3 font-mono text-xs" data-speed={-60}>
              <span className="mr-2 inline-block size-1.5 rounded-full bg-accent led-pulse" />
              {cell.badge}
            </div>
          </div>

          <div>
            <dl className="specs divide-y divide-line border-y border-line">
              {cell.specs.map((s) => (
                <div key={s.k} className="spec-row grid grid-cols-[9rem_1fr] gap-4 py-5 sm:grid-cols-[11rem_1fr]">
                  <dt className="font-mono text-xs tracking-widest text-muted uppercase">{s.k}</dt>
                  <dd className="text-lg leading-snug">{s.v}</dd>
                </div>
              ))}
            </dl>
            <p data-reveal className="mt-8 text-lg leading-relaxed text-pretty text-muted">
              <span className="text-fg">{cell.kicker.split(".")[0]}.</span>
              {cell.kicker.slice(cell.kicker.indexOf(".") + 1)}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
