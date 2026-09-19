"use client";

import { useEffect, useRef, useState } from "react";
import { Wordmark } from "@/components/ui/wordmark";
import { gsap } from "@/lib/gsap";

const LINES = ["init motors", "calibrate sensors", "load firmware", "hello, builder"];

/**
 * Boot screen. Waits for the hero robot to load (or 4 s, whichever is first),
 * then wipes away and tells the hero to play its intro.
 */
export function Loader() {
  const root = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const [line, setLine] = useState(0);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const started = performance.now();
    let done = false;
    const ticker = window.setInterval(() => setLine((l) => Math.min(l + 1, LINES.length - 1)), 380);
    const progress = gsap.to(bar.current, { scaleX: 0.85, duration: 3.5, ease: "power2.out" });

    const finish = () => {
      if (done) return;
      done = true;
      const wait = Math.max(0, 900 - (performance.now() - started));
      window.setTimeout(() => {
        window.clearInterval(ticker);
        setLine(LINES.length - 1);
        progress.kill();
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        gsap
          .timeline({
            onComplete: () => {
              document.documentElement.dataset.intro = "done";
              window.dispatchEvent(new Event("bc:intro"));
              setGone(true);
            },
          })
          .to(bar.current, { scaleX: 1, duration: 0.35, ease: "power2.inOut" })
          .to(root.current, reduce ? { autoAlpha: 0, duration: 0.3 } : { yPercent: -100, duration: 1, ease: "expo.inOut" });
      }, wait);
    };

    window.addEventListener("bc:scene-ready", finish, { once: true });
    const fallback = window.setTimeout(finish, 4000);
    return () => {
      window.removeEventListener("bc:scene-ready", finish);
      window.clearTimeout(fallback);
      window.clearInterval(ticker);
      progress.kill();
    };
  }, []);

  if (gone) return null;

  return (
    <div
      ref={root}
      aria-hidden
      className="fixed inset-0 z-[70] flex flex-col justify-between bg-bg p-6 blueprint sm:p-10"
    >
      <Wordmark className="text-2xl" />
      <div>
        <p className="mb-3 font-mono text-xs text-muted">
          <span className="text-accent-ink">$</span> builderscell --boot
          <br />
          <span className="text-fg">&gt; {LINES[line]}</span>
          <span className="ml-1 inline-block h-3 w-1.5 animate-pulse bg-accent align-middle" />
        </p>
        <div className="h-px w-full overflow-hidden bg-line">
          <div ref={bar} className="h-full origin-left scale-x-0 bg-accent" />
        </div>
      </div>
    </div>
  );
}
