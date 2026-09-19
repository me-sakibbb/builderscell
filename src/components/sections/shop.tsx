"use client";

import { useRef } from "react";
import { Battery, Cable, Cog, Cpu, Gauge, Plus, Radar, Wrench, Zap } from "lucide-react";
import { bdt, shop } from "@/content/site";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/reveal";

const ICONS = { chip: Cpu, radar: Radar, cog: Cog, zap: Zap, battery: Battery, wrench: Wrench, gauge: Gauge, cable: Cable } as const;

/** Horizontal rail with mouse drag-to-scroll; touch uses native scrolling. */
function useDragScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef({ on: false, x: 0, left: 0, moved: false });
  return {
    ref,
    onPointerDown: (e: React.PointerEvent) => {
      if (e.pointerType !== "mouse" || !ref.current) return;
      drag.current = { on: true, x: e.clientX, left: ref.current.scrollLeft, moved: false };
    },
    onPointerMove: (e: React.PointerEvent) => {
      const d = drag.current;
      if (!d.on || !ref.current) return;
      const dx = e.clientX - d.x;
      if (Math.abs(dx) > 4) d.moved = true;
      ref.current.scrollLeft = d.left - dx;
    },
    onPointerUp: () => {
      drag.current.on = false;
    },
    onPointerLeave: () => {
      drag.current.on = false;
    },
    onClickCapture: (e: React.MouseEvent) => {
      if (drag.current.moved) {
        e.preventDefault();
        e.stopPropagation();
        drag.current.moved = false;
      }
    },
  };
}

export function Shop() {
  const { ref, ...handlers } = useDragScroll();
  return (
    <section id="shop" className="relative overflow-hidden bg-bg-elev py-28 sm:py-40">
      <div className="container-x flex flex-wrap items-end justify-between gap-8">
        <SectionHeading eyebrow={shop.eyebrow} title={shop.title} body={shop.body} titleClassName="max-w-[16ch]" />
        <div data-reveal className="flex flex-col items-start gap-3">
          <Button href={shop.cta.href}>{shop.cta.label}</Button>
          <span className="font-mono text-[11px] text-muted">{shop.note}</span>
        </div>
      </div>

      <div
        ref={ref}
        {...handlers}
        data-lenis-prevent-horizontal
        className="no-scrollbar mt-14 flex cursor-grab snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-4 select-none active:cursor-grabbing sm:scroll-px-8 sm:px-8 xl:scroll-px-[calc((100vw-1280px)/2+2rem)] xl:px-[calc((100vw-1280px)/2+2rem)]"
      >
        {shop.products.map((p, i) => {
          const Icon = ICONS[p.icon as keyof typeof ICONS];
          return (
            <a
              key={p.name}
              href={shop.cta.href}
              draggable={false}
              className="group relative flex w-[78vw] max-w-[300px] shrink-0 snap-start flex-col overflow-hidden rounded-3xl hairline bg-surface transition-transform duration-500 ease-out-expo hover:-translate-y-1.5"
            >
              <div className="relative aspect-[4/3.4] overflow-hidden border-b border-line bg-bg">
                <div className="absolute inset-0 grid place-items-center blueprint">
                  <div className="relative grid size-28 place-items-center rounded-full hairline bg-bg-elev transition-transform duration-700 ease-out-expo group-hover:scale-110 group-hover:rotate-6">
                    <span
                      aria-hidden
                      className="absolute inset-0 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                      style={{ boxShadow: "0 0 60px var(--glow)" }}
                    />
                    <Icon className="size-10 text-accent-ink" strokeWidth={1.4} />
                  </div>
                </div>
                <span className="absolute top-3 left-3 rounded-full glass hairline px-2.5 py-1 font-mono text-[10px] tracking-wider uppercase">
                  {p.cat}
                </span>
                <span className="absolute top-3 right-3 font-mono text-[10px] text-muted">
                  #{String(i + 1).padStart(3, "0")}
                </span>
              </div>
              <div className="flex items-end justify-between gap-3 p-5">
                <div>
                  <h3 className="font-medium leading-tight">{p.name}</h3>
                  <p className="mt-1 font-mono text-sm text-muted">{bdt(p.price)}</p>
                </div>
                <span className="grid size-9 shrink-0 place-items-center rounded-full hairline transition-colors group-hover:border-accent group-hover:bg-accent group-hover:text-accent-fg">
                  <Plus className="size-4" />
                </span>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
