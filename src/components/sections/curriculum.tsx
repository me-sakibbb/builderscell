"use client";

import { Fragment, useRef } from "react";
import { curriculum } from "@/content/site";
import { SectionHeading } from "@/components/ui/reveal";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";

// Round so server and client render identical SVG attributes.
const r2 = (n: number) => Math.round(n * 100) / 100;

/* Small looping line drawings, one per phase. Pure SVG + SMIL, no JS. */
function Art({ kind }: { kind: string }) {
  const stroke = {
    fill: "none",
    stroke: "var(--accent)",
    strokeWidth: 2,
    vectorEffect: "non-scaling-stroke" as const,
  };
  const faint = { fill: "none", stroke: "var(--line-strong)", strokeWidth: 1 };
  if (kind === "wave")
    return (
      <svg viewBox="0 0 400 200" className="size-full" aria-hidden>
        <path d="M0 100 H400" {...faint} />
        <path d="M0 100 Q25 20 50 100 T100 100 T150 100 T200 100 T250 100 T300 100 T350 100 T400 100" {...stroke}>
          <animateTransform
            attributeName="transform"
            type="translate"
            from="0 0"
            to="-100 0"
            dur="2s"
            repeatCount="indefinite"
          />
        </path>
        <path d="M400 100 Q425 20 450 100 T500 100" {...stroke}>
          <animateTransform
            attributeName="transform"
            type="translate"
            from="0 0"
            to="-100 0"
            dur="2s"
            repeatCount="indefinite"
          />
        </path>
        <path d="M0 150 H80 V60 H160 V150 H240 V60 H320 V150 H400" {...faint} strokeDasharray="4 6" />
      </svg>
    );
  if (kind === "gears")
    return (
      <svg viewBox="0 0 400 200" className="size-full" aria-hidden>
        {[
          { cx: 160, cy: 100, r: 56, teeth: 12, dir: 1 },
          { cx: 262, cy: 84, r: 40, teeth: 9, dir: -1 },
        ].map((g, i) => (
          <g key={i}>
            <g>
              <circle cx={g.cx} cy={g.cy} r={g.r} {...stroke} />
              <circle cx={g.cx} cy={g.cy} r={g.r * 0.3} {...faint} />
              {Array.from({ length: g.teeth }).map((_, t) => {
                const a = (t / g.teeth) * Math.PI * 2;
                return (
                  <line
                    key={t}
                    x1={r2(g.cx + Math.cos(a) * g.r)}
                    y1={r2(g.cy + Math.sin(a) * g.r)}
                    x2={r2(g.cx + Math.cos(a) * (g.r + 12))}
                    y2={r2(g.cy + Math.sin(a) * (g.r + 12))}
                    {...stroke}
                  />
                );
              })}
              <animateTransform
                attributeName="transform"
                type="rotate"
                from={`0 ${g.cx} ${g.cy}`}
                to={`${g.dir * 360} ${g.cx} ${g.cy}`}
                dur={`${g.teeth * 0.7}s`}
                repeatCount="indefinite"
              />
            </g>
          </g>
        ))}
      </svg>
    );
  if (kind === "radar")
    return (
      <svg viewBox="0 0 400 200" className="size-full" aria-hidden>
        {[30, 60, 90].map((r) => (
          <circle key={r} cx="200" cy="100" r={r} {...faint} />
        ))}
        <g>
          <path d="M200 100 L290 100 A90 90 0 0 0 263.6 36.4 Z" fill="var(--accent)" opacity="0.18" />
          <line x1="200" y1="100" x2="290" y2="100" {...stroke} />
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 200 100"
            to="-360 200 100"
            dur="3s"
            repeatCount="indefinite"
          />
        </g>
        {[
          [250, 60],
          [150, 140],
          [262, 128],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="4" fill="var(--signal)">
            <animate attributeName="opacity" values="0;1;0" dur="3s" begin={`${i * 0.9}s`} repeatCount="indefinite" />
          </circle>
        ))}
      </svg>
    );
  return (
    <svg viewBox="0 0 400 200" className="size-full" aria-hidden>
      <path d="M40 170 C120 170 110 110 190 110 S270 60 330 40" {...faint} strokeDasharray="4 6" />
      <path
        d="M40 170 C120 170 110 110 190 110 S270 60 330 40"
        {...stroke}
        pathLength={1}
        strokeDasharray="1"
        strokeDashoffset="1"
      >
        <animate
          attributeName="stroke-dashoffset"
          values="1;0;0"
          keyTimes="0;0.7;1"
          dur="3.2s"
          repeatCount="indefinite"
        />
      </path>
      <path d="M330 40 V6 L360 16 L330 26" {...stroke} />
      <circle cx="40" cy="170" r="5" fill="var(--accent)" />
    </svg>
  );
}

export function Curriculum() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const cards = gsap.utils.toArray<HTMLElement>(".phase-card");
        const spacers = gsap.utils.toArray<HTMLElement>(".phase-spacer");
        const stickyTop = (el: HTMLElement) => parseFloat(getComputedStyle(el).top) || 0;
        cards.forEach((card, i) => {
          const next = cards[i + 1];
          const spacer = spacers[i];
          if (!next || !spacer) return;
          // Sink back only while the next card actually covers this one: from the
          // moment its top reaches this card's bottom edge until it locks into its
          // own sticky slot. The trigger is the spacer, not the sticky card: the
          // spacer never sticks, and its bottom edge is where the next card sits
          // until it docks. Dim with brightness, not opacity, so the card stays
          // solid over the one beneath it.
          gsap.fromTo(
            card.firstElementChild,
            { scale: 1, filter: "brightness(1)" },
            {
              scale: 0.93,
              filter: "brightness(0.5)",
              ease: "none",
              scrollTrigger: {
                trigger: spacer,
                start: () => `bottom ${stickyTop(card) + card.offsetHeight}px`,
                end: () => `bottom ${stickyTop(next)}px`,
                scrub: true,
                invalidateOnRefresh: true,
              },
            },
          );
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="curriculum" className="relative bg-bg py-28 sm:py-40">
      <div className="container-x">
        <SectionHeading
          eyebrow={curriculum.eyebrow}
          title={curriculum.title}
          body={curriculum.body}
          titleClassName="max-w-[18ch]"
        />
        {/* Bottom padding matches the stack offsets, so the cards leave together. */}
        <div className="mt-16" style={{ paddingBottom: `${(curriculum.phases.length - 1) * 1.25}rem` }}>
          {curriculum.phases.map((p, i) => (
            <Fragment key={p.tag}>
              <div className="phase-card sticky" style={{ top: `calc(6rem + ${i * 1.25}rem)` }}>
                <article className="grid origin-top overflow-hidden rounded-[2rem] hairline bg-surface shadow-[0_-20px_60px_-30px_rgb(0_0_0/0.35)] md:grid-cols-[1.1fr_1fr]">
                  <div className="flex flex-col justify-between gap-10 p-8 sm:p-12">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs tracking-widest text-accent-ink uppercase">{p.tag}</span>
                      <span className="font-mono text-xs text-muted">
                        {String(i + 1).padStart(2, "0")} / {String(curriculum.phases.length).padStart(2, "0")}
                      </span>
                    </div>
                    <div>
                      <h3 className="display text-[clamp(2.4rem,5vw,4.5rem)]">{p.title}</h3>
                      <p className="mt-4 max-w-md text-lg leading-relaxed text-muted">{p.body}</p>
                    </div>
                  </div>
                  <div className="relative min-h-[220px] border-t border-line bg-bg-elev blueprint p-8 md:border-t-0 md:border-l">
                    <Art kind={p.art} />
                  </div>
                </article>
              </div>
              {/* Scroll room between phases. A spacer, not a margin: sticky
                elements count their margin, so a margin would un-stick cards early. */}
              {i < curriculum.phases.length - 1 && (
                <div aria-hidden className="phase-spacer" style={{ height: "35vh" }} />
              )}
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
