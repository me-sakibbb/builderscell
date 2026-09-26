"use client";

import { useRef } from "react";
import Image from "next/image";
import { Check, Clock } from "lucide-react";
import { bdt, teams } from "@/content/site";
import { Button } from "@/components/ui/button";
import { SplitWords } from "@/components/ui/reveal";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";

export function Teams() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.fromTo(
          ".teams-img",
          { yPercent: -12, scale: 1.15 },
          {
            yPercent: 12,
            scale: 1.05,
            ease: "none",
            scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true },
          },
        );
        // The frame opens from an inset window to full bleed.
        gsap.fromTo(
          ".teams-frame",
          { clipPath: "inset(8% 6% 8% 6% round 32px)" },
          {
            clipPath: "inset(0% 0% 0% 0% round 0px)",
            ease: "none",
            scrollTrigger: { trigger: root.current, start: "top 85%", end: "top 15%", scrub: true },
          },
        );
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="teams" className="relative bg-bg">
      <div className="teams-frame relative min-h-[100svh] overflow-hidden">
        <Image
          src={teams.image.src}
          alt={teams.image.alt}
          fill
          sizes="100vw"
          className="teams-img object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/20" />
        <div className="relative container-x flex min-h-[100svh] flex-col justify-center py-28 text-white">
          <p className="eyebrow mb-5">{teams.eyebrow}</p>
          <h2 className="display max-w-[15ch] text-[clamp(2.4rem,6vw,5.4rem)] text-balance">
            <SplitWords text={teams.title} />
          </h2>
          <p data-reveal className="mt-6 max-w-xl text-lg leading-relaxed text-white/75">
            {teams.body}
          </p>

          <div data-reveal className="mt-10 w-full max-w-md rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="label text-white/60">Hourly access</p>
                <p className="mt-2 font-mono text-4xl font-medium tracking-tight">
                  {bdt(teams.rate)}
                  <span className="ml-2 text-sm text-white/60">{teams.unit}</span>
                </p>
                <p className="mt-1 text-xs text-white/50">Placeholder rate</p>
              </div>
              <span className="grid size-11 place-items-center rounded-full border border-white/20">
                <Clock className="size-5" />
              </span>
            </div>
            <ul className="mt-6 grid grid-cols-2 gap-2.5 text-sm">
              {teams.perks.map((p) => (
                <li key={p} className="flex items-center gap-2 text-white/85">
                  <Check className="size-4 text-[#2ee89a]" />
                  {p}
                </li>
              ))}
            </ul>
            <Button href={teams.cta.href} className="mt-6 w-full !bg-white !text-black hover:!bg-[#00d47e]">
              {teams.cta.label}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
