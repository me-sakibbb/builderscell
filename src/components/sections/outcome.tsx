"use client";

import { useRef } from "react";
import { Award, Globe, Rocket } from "lucide-react";
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from "motion/react";
import { outcome } from "@/content/site";
import { SectionHeading } from "@/components/ui/reveal";
import { Wordmark } from "@/components/ui/wordmark";

const ICONS = { award: Award, globe: Globe, rocket: Rocket } as const;

/** A certificate you can tilt, with a sheen that tracks the light. */
function Certificate() {
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rx = useSpring(useTransform(py, [0, 1], [10, -10]), { stiffness: 150, damping: 18 });
  const ry = useSpring(useTransform(px, [0, 1], [-14, 14]), { stiffness: 150, damping: 18 });
  const sx = useTransform(px, [0, 1], [0, 100]);
  const sy = useTransform(py, [0, 1], [0, 100]);
  const sheen = useMotionTemplate`radial-gradient(600px circle at ${sx}% ${sy}%, rgb(255 255 255 / 0.22), transparent 45%)`;

  return (
    <div
      className="[perspective:1200px]"
      onPointerMove={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        px.set((e.clientX - r.left) / r.width);
        py.set((e.clientY - r.top) / r.height);
      }}
      onPointerLeave={() => {
        px.set(0.5);
        py.set(0.5);
      }}
    >
      <motion.div
        ref={ref}
        style={{ rotateX: rx, rotateY: ry }}
        className="relative aspect-[1.414/1] w-full overflow-hidden rounded-2xl border border-line-strong bg-surface p-[6%] shadow-[0_40px_80px_-30px_rgb(0_0_0/0.45)]"
      >
        <div aria-hidden className="absolute inset-[3%] rounded-xl border border-line" />
        <div aria-hidden className="absolute inset-0 blueprint opacity-60" />
        <div className="relative flex h-full flex-col justify-between">
          <div className="flex items-start justify-between">
            <Wordmark className="text-[clamp(0.9rem,2vw,1.4rem)]" />
            <span className="font-mono text-[clamp(0.5rem,1vw,0.7rem)] tracking-widest text-muted uppercase">No. BC-2026-0001</span>
          </div>
          <div>
            <p className="font-mono text-[clamp(0.55rem,1vw,0.75rem)] tracking-[0.25em] text-accent-ink uppercase">
              Certificate of completion
            </p>
            <p className="mt-2 text-[clamp(1.4rem,3.4vw,2.6rem)] leading-none font-semibold tracking-tight">Your name here</p>
            <p className="mt-3 max-w-[40ch] text-[clamp(0.6rem,1.1vw,0.85rem)] text-muted">
              has completed nine months in the Cell: Foundations, Systems, Autonomy and a mentor-guided Capstone build.
            </p>
          </div>
          <div className="flex items-end justify-between">
            <div className="h-px w-1/3 bg-line-strong" />
            <div className="relative grid size-[clamp(3rem,7vw,5rem)] place-items-center rounded-full border-2 border-accent text-accent-ink">
              <Award className="size-1/2" strokeWidth={1.5} />
              <span className="absolute inset-1 rounded-full border border-dashed border-accent/50" />
            </div>
          </div>
        </div>
        <motion.div aria-hidden className="pointer-events-none absolute inset-0 mix-blend-overlay" style={{ background: sheen }} />
      </motion.div>
    </div>
  );
}

export function Outcome() {
  return (
    <section id="outcome" className="relative bg-bg py-28 sm:py-40">
      <div className="container-x grid gap-16 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div>
          <SectionHeading eyebrow={outcome.eyebrow} title={outcome.title} body={outcome.body} titleClassName="text-[clamp(2.2rem,4.6vw,4.2rem)]" />
          <ul className="mt-10 space-y-3">
            {outcome.paths.map((p, i) => {
              const Icon = ICONS[p.icon as keyof typeof ICONS];
              return (
                <li
                  key={p.title}
                  data-reveal
                  className="group flex items-center gap-4 rounded-2xl hairline bg-surface px-5 py-4 transition-colors hover:border-accent"
                >
                  <span className="font-mono text-xs text-muted">0{i + 1}</span>
                  <span className="text-lg font-medium">{p.title}</span>
                  <Icon className="ml-auto size-5 text-muted transition-colors group-hover:text-accent-ink" />
                </li>
              );
            })}
          </ul>
        </div>
        <div data-reveal>
          <Certificate />
        </div>
      </div>
    </section>
  );
}
