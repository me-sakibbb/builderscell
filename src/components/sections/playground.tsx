"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Bot, Gamepad2, RotateCcw, ShieldCheck } from "lucide-react";
import { playground } from "@/content/site";
import { SectionHeading } from "@/components/ui/reveal";
import { Scene } from "@/components/three";
import { createRoverControls, type RoverTelemetry } from "@/components/three/bus";
import { cn } from "@/lib/cn";

type Dir = "up" | "down" | "left" | "right";
const KEYS: Record<string, Dir> = {
  w: "up",
  arrowup: "up",
  s: "down",
  arrowdown: "down",
  a: "left",
  arrowleft: "left",
  d: "right",
  arrowright: "right",
};

export function Playground() {
  const controls = useRef(createRoverControls());
  const telemetry = useRef<RoverTelemetry>({ distance: 0, pwmL: 0, pwmR: 0, servo: 90, blocked: false });
  const [auto, setAuto] = useState(false);
  const [guard, setGuard] = useState(true);
  const [servo, setServo] = useState(90);
  const held = useRef(new Set<Dir>());
  const [pressed, setPressed] = useState<Set<Dir>>(new Set());

  const monitor = useRef<HTMLPreElement>(null);
  const dist = useRef<HTMLSpanElement>(null);
  const barL = useRef<HTMLSpanElement>(null);
  const barR = useRef<HTMLSpanElement>(null);
  const lines = useRef<string[]>([]);
  const deck = useRef<HTMLDivElement>(null);

  const apply = useCallback(() => {
    const h = held.current;
    controls.current.throttle = (h.has("up") ? 1 : 0) - (h.has("down") ? 1 : 0);
    controls.current.steer = (h.has("left") ? 1 : 0) - (h.has("right") ? 1 : 0);
    setPressed(new Set(h));
  }, [controls]);

  const press = (d: Dir, on: boolean) => {
    if (on) held.current.add(d);
    else held.current.delete(d);
    apply();
  };

  // Keyboard driving while the playground is on screen. Arrow keys are only
  // captured when focus is inside the control deck, so page scrolling still works.
  useEffect(() => {
    let visible = false;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.4 });
    if (deck.current) io.observe(deck.current);
    const key = (on: boolean) => (e: KeyboardEvent) => {
      const d = KEYS[e.key.toLowerCase()];
      if (!d || !visible) return;
      const isArrow = e.key.startsWith("Arrow");
      if (isArrow && !deck.current?.contains(document.activeElement)) return;
      if ((e.target as HTMLElement)?.tagName === "INPUT" && isArrow) return;
      e.preventDefault();
      if (on) held.current.add(d);
      else held.current.delete(d);
      apply();
    };
    const down = key(true);
    const up = key(false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      io.disconnect();
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [apply]);

  // Called by the rover a few times a second; writes straight to the DOM.
  const onTelemetry = useCallback(() => {
    const t = telemetry.current;
    if (dist.current) dist.current.textContent = String(t.distance).padStart(3, "0");
    if (barL.current) barL.current.style.transform = `scaleX(${Math.abs(t.pwmL) / 255})`;
    if (barR.current) barR.current.style.transform = `scaleX(${Math.abs(t.pwmR) / 255})`;
    const line =
      `dist=${String(t.distance).padStart(3, " ")}cm  L=${String(t.pwmL).padStart(4, " ")}  R=${String(t.pwmR).padStart(4, " ")}  servo=${String(t.servo).padStart(3, " ")}°` +
      (t.blocked ? "  STOP" : "");
    lines.current = [...lines.current.slice(-6), line];
    if (monitor.current) monitor.current.textContent = lines.current.join("\n");
  }, [telemetry]);

  const pad = (d: Dir, Icon: typeof ArrowUp, cls: string) => (
    <button
      type="button"
      aria-label={`Drive ${d}`}
      disabled={auto}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        press(d, true);
      }}
      onPointerUp={() => press(d, false)}
      onPointerCancel={() => press(d, false)}
      onContextMenu={(e) => e.preventDefault()}
      className={cn(
        "grid size-12 touch-none place-items-center rounded-xl hairline bg-bg-elev transition-all select-none disabled:opacity-30",
        pressed.has(d) && "scale-95 border-accent bg-accent text-accent-fg",
        cls,
      )}
    >
      <Icon className="size-5" />
    </button>
  );

  return (
    <section id="playground" className="relative bg-bg py-24 sm:py-32">
      <div className="container-x">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <SectionHeading eyebrow={playground.eyebrow} title={playground.title} body={playground.body} />
          <p data-reveal className="font-mono text-xs text-muted lg:text-right">
            W A S D to drive
            <br />
            or use the pad
          </p>
        </div>

        {/* No transform or z-index here: the HUD must stay above the 3D canvas. */}
        <div className="relative mt-12 overflow-hidden rounded-[2rem] hairline bg-bg-elev">
          <div aria-hidden className="absolute inset-0 blueprint" />
          <Scene
            scene="rover"
            controls={controls}
            telemetryRef={telemetry}
            onTelemetry={onTelemetry}
            className="h-[62svh] min-h-[420px] w-full"
          />

          {/* HUD: distance and wheel output */}
          <div className="pointer-events-none absolute top-4 left-4 z-10 rounded-2xl glass hairline p-4 font-mono text-xs sm:top-6 sm:left-6">
            <p className="text-muted">ULTRASONIC</p>
            <p className="mt-1 text-3xl font-medium tracking-tight text-fg">
              <span ref={dist}>000</span>
              <span className="ml-1 text-sm text-muted">cm</span>
            </p>
            <div className="mt-3 space-y-1.5">
              {[
                ["L", barL],
                ["R", barR],
              ].map(([k, ref]) => (
                <div key={k as string} className="flex items-center gap-2">
                  <span className="w-3 text-muted">{k as string}</span>
                  <span className="relative h-1 w-24 overflow-hidden rounded-full bg-line">
                    <span
                      ref={ref as React.RefObject<HTMLSpanElement>}
                      className="absolute inset-0 origin-left scale-x-0 rounded-full bg-accent"
                    />
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* serial monitor */}
          <div className="pointer-events-none absolute top-4 right-4 z-10 hidden w-[380px] rounded-2xl bg-black/80 p-4 font-mono text-[11px] leading-relaxed text-[#7dffbf] backdrop-blur md:block sm:top-6 sm:right-6">
            <p className="mb-2 flex items-center justify-between text-white/50">
              <span>Serial monitor · 115200 baud</span>
              <span className="size-1.5 rounded-full bg-[#00d47e] led-pulse" />
            </p>
            <pre ref={monitor} className="h-[7.5rem] overflow-hidden whitespace-pre" />
          </div>
        </div>

        {/* control deck */}
        <div
          ref={deck}
          className="mt-4 grid gap-4 rounded-[2rem] hairline bg-surface p-4 sm:p-6 md:grid-cols-[auto_1fr_auto] md:items-center md:gap-8"
        >
          <div className="grid w-max grid-cols-3 gap-2 justify-self-center md:justify-self-start">
            {pad("up", ArrowUp, "col-start-2")}
            {pad("left", ArrowLeft, "col-start-1 row-start-2")}
            {pad("down", ArrowDown, "col-start-2 row-start-2")}
            {pad("right", ArrowRight, "col-start-3 row-start-2")}
          </div>

          <label className="block">
            <span className="mb-2 flex justify-between font-mono text-xs text-muted">
              <span>Servo angle</span>
              <span className="text-fg">{auto ? "scanning" : `${servo}°`}</span>
            </span>
            <input
              type="range"
              min={10}
              max={170}
              value={servo}
              disabled={auto}
              onChange={(e) => {
                const v = Number(e.target.value);
                setServo(v);
                controls.current.servo = v;
              }}
              className="w-full accent-[var(--accent)] disabled:opacity-40"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              aria-pressed={auto}
              onClick={() => {
                const next = !auto;
                setAuto(next);
                controls.current.autopilot = next;
                held.current.clear();
                apply();
              }}
              className={cn(
                "flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors",
                auto ? "bg-accent text-accent-fg" : "hairline hover:bg-bg-elev",
              )}
            >
              {auto ? <Bot className="size-4" /> : <Gamepad2 className="size-4" />}
              {auto ? "Autopilot on" : "Manual"}
            </button>
            <button
              type="button"
              aria-pressed={guard}
              onClick={() => {
                setGuard(!guard);
                controls.current.guard = !guard;
              }}
              className={cn(
                "flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors",
                guard ? "bg-fg text-bg" : "hairline text-muted hover:bg-bg-elev",
              )}
            >
              <ShieldCheck className="size-4" />
              Obstacle stop
            </button>
            <button
              type="button"
              aria-label="Reset rover"
              onClick={() => {
                controls.current.reset += 1;
                lines.current = [];
              }}
              className="grid size-11 place-items-center rounded-full hairline transition-colors hover:bg-bg-elev"
            >
              <RotateCcw className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
