"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { RotateCcw } from "lucide-react";
import { myths } from "@/content/site";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/cn";

/** Myth on the front, truth on the back. Hover or tap to flip. */
function FlipCard({ card, index }: { card: (typeof myths.cards)[number]; index: number }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <button
      type="button"
      data-reveal
      onClick={() => setFlipped((f) => !f)}
      onPointerEnter={(e) => e.pointerType === "mouse" && setFlipped(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setFlipped(false)}
      aria-pressed={flipped}
      aria-label={`${card.myth} Reveal what's true.`}
      className="group relative h-[440px] w-full text-left [perspective:1400px]"
    >
      <div
        className={cn(
          "relative size-full transition-transform duration-[900ms] ease-out-expo [transform-style:preserve-3d]",
          flipped && "[transform:rotateY(180deg)]",
        )}
      >
        {/* front: the myth */}
        <div className="absolute inset-0 flex flex-col justify-between overflow-hidden rounded-3xl hairline bg-surface p-7 [backface-visibility:hidden]">
          <div className="flex items-center justify-between font-mono text-xs text-muted">
            <span>MYTH_0{index + 1}</span>
            <span className="flex items-center gap-1.5 text-signal">
              <span className="size-1.5 rounded-full bg-signal" /> false
            </span>
          </div>
          <p className="text-[1.9rem] leading-[1.1] font-semibold tracking-tight text-balance">{card.myth}</p>
          <span className="flex items-center gap-2 font-mono text-xs text-muted">
            <RotateCcw className="size-3.5" /> Hover or tap for the truth
          </span>
        </div>
        {/* back: the truth, over a photo */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl bg-fg text-bg [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <Image src={card.image} alt={card.alt} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover opacity-45" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/10" />
          <div className="relative flex h-full flex-col justify-between p-7 text-white">
            <span className="flex items-center gap-1.5 font-mono text-xs text-accent">
              <span className="size-1.5 rounded-full bg-accent" /> true
            </span>
            <p className="text-xl leading-snug font-medium text-pretty">{card.truth}</p>
          </div>
        </div>
      </div>
    </button>
  );
}

export function Myths() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        // Each word brightens as the statement scrolls through the viewport.
        gsap.fromTo(
          ".myth-word",
          { opacity: 0.14 },
          {
            opacity: 1,
            ease: "none",
            stagger: 0.1,
            scrollTrigger: { trigger: ".myth-statement", start: "top 80%", end: "bottom 45%", scrub: true },
          },
        );
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="myths" className="relative z-10 bg-bg py-28 sm:py-40">
      <div className="container-x">
        <p data-reveal className="eyebrow mb-8">
          What people get wrong
        </p>
        <p className="myth-statement display max-w-[22ch] text-[clamp(2.2rem,5.4vw,4.8rem)] text-balance">
          {myths.statement.split(" ").map((w, i) => (
            <span key={i} className="myth-word">
              {w}{" "}
            </span>
          ))}
        </p>
        <div className="mt-20 grid gap-5 md:grid-cols-3">
          {myths.cards.map((c, i) => (
            <FlipCard key={c.myth} card={c} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
