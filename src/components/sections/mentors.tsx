"use client";

import { useRef } from "react";
import { Bot, Cpu, Radar, UserRound } from "lucide-react";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "motion/react";
import { mentors } from "@/content/site";
import { SectionHeading } from "@/components/ui/reveal";

const ICONS = { bot: Bot, chip: Cpu, radar: Radar } as const;

/** Card that tilts toward the pointer with a spotlight that follows it. */
function TiltCard({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(50);
  const my = useMotionValue(50);
  const rx = useSpring(0, { stiffness: 200, damping: 20 });
  const ry = useSpring(0, { stiffness: 200, damping: 20 });
  const spot = useMotionTemplate`radial-gradient(420px circle at ${mx}% ${my}%, var(--glow), transparent 60%)`;

  return (
    <motion.div
      ref={ref}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse" || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        mx.set(px * 100);
        my.set(py * 100);
        rx.set((0.5 - py) * 10);
        ry.set((px - 0.5) * 12);
      }}
      onPointerLeave={() => {
        rx.set(0);
        ry.set(0);
      }}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      className="group relative h-full overflow-hidden rounded-3xl hairline bg-surface"
    >
      <motion.div aria-hidden className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{ background: spot }} />
      {children}
    </motion.div>
  );
}

export function Mentors() {
  return (
    <section id="mentors" className="relative bg-bg py-28 sm:py-40">
      <div className="container-x">
        <SectionHeading eyebrow={mentors.eyebrow} title={mentors.title} body={mentors.body} titleClassName="max-w-[16ch]" />
        <div className="mt-16 grid gap-5 md:grid-cols-3">
          {mentors.tracks.map((t, i) => {
            const Icon = ICONS[t.icon as keyof typeof ICONS];
            return (
              <div key={t.title} data-reveal>
                <TiltCard>
                  <div className="relative flex h-full min-h-[380px] flex-col p-7">
                    <div className="flex items-center justify-between">
                      <span className="grid size-12 place-items-center rounded-2xl hairline bg-bg-elev">
                        <Icon className="size-5 text-accent-ink" />
                      </span>
                      <span className="font-mono text-xs text-muted">TRACK_0{i + 1}</span>
                    </div>
                    <h3 className="mt-auto text-3xl font-semibold tracking-tight">{t.title}</h3>
                    <p className="mt-3 leading-relaxed text-muted">{t.body}</p>
                    {/* placeholder slots until real mentor profiles are published */}
                    <div className="mt-7 flex items-center gap-3 border-t border-line pt-5">
                      <div className="flex -space-x-2">
                        {[0, 1, 2].map((a) => (
                          <span key={a} className="grid size-8 place-items-center rounded-full border-2 border-surface bg-surface-2">
                            <UserRound className="size-4 text-muted" />
                          </span>
                        ))}
                      </div>
                      <span className="text-xs text-muted">{mentors.pending}</span>
                    </div>
                  </div>
                </TiltCard>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
