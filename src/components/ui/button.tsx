"use client";

import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { motion, useMotionValue, useSpring } from "motion/react";
import { cn } from "@/lib/cn";

type Props = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "ghost";
  size?: "md" | "lg";
  className?: string;
  arrow?: boolean;
};

/** Link-button that leans toward the pointer. */
export function Button({ href, children, variant = "primary", size = "md", className, arrow = true }: Props) {
  const ref = useRef<HTMLAnchorElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 300, damping: 20, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 300, damping: 20, mass: 0.4 });

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - r.left - r.width / 2) * 0.18);
    y.set((e.clientY - r.top - r.height / 2) * 0.28);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.a
      ref={ref}
      href={href}
      onPointerMove={onMove}
      onPointerLeave={reset}
      style={{ x: sx, y: sy }}
      className={cn(
        "group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full font-medium whitespace-nowrap transition-colors duration-300",
        size === "lg" ? "h-13 px-7 text-base" : "h-11 px-5 text-sm",
        variant === "primary"
          ? "bg-fg text-bg hover:bg-accent hover:text-accent-fg"
          : "hairline text-fg hover:border-line-strong hover:bg-surface",
        className,
      )}
    >
      <span className="relative">{children}</span>
      {arrow && (
        <ArrowRight
          aria-hidden
          className="relative size-4 transition-transform duration-300 ease-out-expo group-hover:translate-x-0.5"
        />
      )}
    </motion.a>
  );
}
