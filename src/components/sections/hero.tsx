"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { hero } from "@/content/site";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { Scene } from "@/components/three";
import { createHeroState, robotBus, type Gesture } from "@/components/three/bus";
import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from "@/lib/gsap";

const COMMANDS: { label: string; gesture: Gesture }[] = [
  { label: "wave()", gesture: "Wave" },
  { label: "dance()", gesture: "Dance" },
  { label: "jump()", gesture: "Jump" },
  { label: "spin()", gesture: "Spin" },
];

/** A comic speech bubble that pops up beside the robot whenever it gestures. */
function SpeechBubble() {
  const [line, setLine] = useState<{ id: number; text: string } | null>(null);
  useEffect(() => {
    let hide: number | undefined;
    const off = robotBus.on((g) => {
      setLine({ id: Date.now(), text: hero.robotLines[g] });
      window.clearTimeout(hide);
      hide = window.setTimeout(() => setLine(null), 2400);
    });
    return () => {
      off();
      window.clearTimeout(hide);
    };
  }, []);
  return (
    <div aria-live="polite" className="pointer-events-none absolute top-[9%] left-1/2 z-10 -translate-x-1/2 md:top-[16%] md:left-[64%] md:translate-x-0">
      <AnimatePresence mode="wait">
        {line && (
          <motion.p
            key={line.id}
            initial={{ opacity: 0, scale: 0.6, y: 12, rotate: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotate: -3 }}
            exit={{ opacity: 0, scale: 0.8, y: -8 }}
            transition={{ type: "spring", stiffness: 420, damping: 18 }}
            className="relative origin-bottom-left rounded-2xl rounded-bl-sm bg-fg px-4 py-2.5 text-base font-semibold whitespace-nowrap text-bg shadow-xl"
          >
            {line.text}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const state = useRef(createHeroState());
  const { user } = useUser();

  useGSAP(
    () => {
      const onMove = (e: PointerEvent) => {
        state.current.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
        state.current.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
      };
      window.addEventListener("pointermove", onMove, { passive: true });

      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const intro = gsap
          .timeline({ paused: true, defaults: { ease: "expo.out" } })
          .from(".hero-word", { yPercent: 115, duration: 1.4, stagger: 0.06 })
          .from(".hero-fade", { autoAlpha: 0, y: 24, duration: 1.1, stagger: 0.08 }, "-=1.0");
        const play = () => intro.play();
        if (document.documentElement.dataset.intro === "done") play();
        else window.addEventListener("bc:intro", play, { once: true });

        // Pin the hero while the camera pulls away and the copy drifts off.
        const copy = root.current!.querySelector(".hero-copy");
        ScrollTrigger.create({
          trigger: root.current,
          start: "top top",
          end: "+=90%",
          pin: true,
          scrub: true,
          onUpdate: (self) => {
            const p = self.progress;
            state.current.progress = p;
            const k = Math.min(p / 0.65, 1);
            gsap.set(copy, { autoAlpha: 1 - k, yPercent: -14 * k });
          },
        });
        return () => window.removeEventListener("bc:intro", play);
      });

      return () => {
        window.removeEventListener("pointermove", onMove);
        mm.revert();
      };
    },
    { scope: root },
  );

  const words = hero.title.split(" ");
  // Until the session resolves, show the sign-up label: /signup redirects members to their
  // profile anyway, so the button is never a dead end while it settles.
  const primary = user ? hero.primaryMember : hero.primary;

  return (
    // z-[6] lifts the hero (and its copy) above the shared 3D canvas at z-5. The
    // backdrop glow and grid live inside the 3D scene, so nothing here covers the robot.
    <section ref={root} id="top" className="relative z-[6] h-svh min-h-[640px] overflow-hidden">
      {/* the robot, clickable to trigger a gesture */}
      <button
        type="button"
        aria-label="Robot: click to say hi"
        onClick={() => robotBus.emit(COMMANDS[Math.floor(Math.random() * COMMANDS.length)].gesture)}
        className="absolute inset-0 cursor-pointer"
      >
        <Scene scene="hero" state={state} className="h-full w-full" />
      </button>
      <SpeechBubble />
      {/* soft floor fade into the next section */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-bg to-transparent" />

      <div className="hero-copy pointer-events-none relative z-10 container-x flex h-full flex-col justify-between pt-28 pb-8 sm:pb-10">
        {/* Keeps the headline in place in this top/middle/bottom column. */}
        <div aria-hidden />


        <div className="mt-auto max-w-[min(100%,52rem)] sm:mt-0">
          <h1 className="display max-w-[13ch] text-[clamp(2.8rem,7.2vw,7rem)]" aria-label={hero.title}>
            {words.map((w, i) => (
              <Fragment key={i}>
                <span aria-hidden className="inline-block overflow-hidden pb-[0.1em] -mb-[0.1em] align-top">
                  <span className={`hero-word inline-block ${i >= words.length - 3 ? "text-accent-ink" : ""}`}>{w}</span>
                </span>{" "}
              </Fragment>
            ))}
          </h1>

          <div className="pointer-events-auto mt-7 max-w-md">
            <p className="hero-fade text-lg leading-relaxed text-muted text-pretty">{hero.sub}</p>
            <div className="hero-fade mt-7 flex flex-wrap gap-3">
              <Button href={primary.href} size="lg">
                {primary.label}
              </Button>
              {/* Temporarily hidden: "Get your kit".
              <Button href={hero.secondary.href} size="lg" variant="ghost" arrow={false}>
                {hero.secondary.label}
              </Button> */}
            </div>
          </div>
        </div>

        <div className="hero-fade pointer-events-auto hidden items-end justify-between gap-4 sm:flex">
          <div className="hidden font-mono text-xs text-muted sm:block">
            <p className="mb-2">{"// "}{hero.hint}</p>
            <div className="flex flex-wrap gap-1.5">
              {COMMANDS.map((c) => (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => robotBus.emit(c.gesture)}
                  className="rounded-md hairline bg-bg-elev/60 px-2.5 py-1.5 text-fg backdrop-blur transition-colors hover:border-accent hover:text-accent-ink"
                >
                  <span className="text-muted">robot.</span>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <a
            href="#numbers"
            className="ml-auto flex items-center gap-2 label text-muted"
          >
            Scroll
            <ChevronDown className="size-4 animate-bounce" />
          </a>
        </div>
      </div>
    </section>
  );
}
