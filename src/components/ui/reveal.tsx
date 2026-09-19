"use client";

import { Fragment } from "react";
import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/cn";

/**
 * Splits a string into masked words. Pair with [data-words] so RevealRoot
 * slides each word up out of its mask when the heading scrolls into view.
 */
export function SplitWords({ text, className }: { text: string; className?: string }) {
  return (
    <span data-words className={cn("block", className)} aria-label={text}>
      {text.split(" ").map((w, i) => (
        <Fragment key={i}>
          <span aria-hidden className="inline-block overflow-hidden pb-[0.12em] -mb-[0.12em] align-top">
            <span className="w-inner inline-block will-change-transform">{w}</span>
          </span>{" "}
        </Fragment>
      ))}
    </span>
  );
}

/**
 * One ScrollTrigger.batch for every [data-reveal] block and [data-words]
 * heading on the page, instead of a trigger per element.
 *
 * An element must end up visible however the visitor reaches it: scrolling
 * down into it, scrolling back up to it, jumping past it with a nav link, or
 * loading the page already scrolled below it (reload, restored scroll). So the
 * reveal runs on every enter/leave callback, runs at most once per element,
 * and anything already above the viewport at start-up is shown immediately.
 */
export function RevealRoot() {
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      const blocks = gsap.utils.toArray<HTMLElement>("[data-reveal]");
      const words = gsap.utils.toArray<HTMLElement>("[data-words]");
      const shown = new WeakSet<HTMLElement>();
      const pending = (els: Element[]) =>
        (els as HTMLElement[]).filter((el) => !shown.has(el) && shown.add(el));

      const showBlocks = (els: Element[]) => {
        const todo = pending(els);
        if (todo.length)
          gsap.to(todo, { autoAlpha: 1, y: 0, duration: 1.1, ease: "expo.out", stagger: 0.08, overwrite: true });
      };
      const showWords = (els: Element[]) =>
        pending(els).forEach((el, i) =>
          gsap.to(el.querySelectorAll(".w-inner"), {
            yPercent: 0,
            duration: 1.2,
            ease: "expo.out",
            stagger: 0.045,
            delay: i * 0.1,
            overwrite: true,
          }),
        );

      // Already scrolled past at start-up: show straight away, no animation.
      const above = (el: HTMLElement) => el.getBoundingClientRect().bottom < 0;
      blocks.forEach((el) => (above(el) ? shown.add(el) : gsap.set(el, { autoAlpha: 0, y: 40 })));
      words.forEach((el) => (above(el) ? shown.add(el) : gsap.set(el.querySelectorAll(".w-inner"), { yPercent: 110 })));

      const on = (show: (els: Element[]) => void) => ({
        onEnter: show,
        onEnterBack: show,
        onLeave: show,
        onLeaveBack: () => {},
      });
      ScrollTrigger.batch(blocks, { start: "top 88%", ...on(showBlocks) });
      ScrollTrigger.batch(words, { start: "top 90%", ...on(showWords) });
    });
    return () => mm.revert();
  });
  return null;
}

export function SectionHeading({
  eyebrow,
  title,
  body,
  className,
  align = "left",
  titleClassName,
}: {
  eyebrow: string;
  title: string;
  body?: string;
  className?: string;
  align?: "left" | "center";
  titleClassName?: string;
}) {
  return (
    <div className={cn(align === "center" && "mx-auto text-center", className)}>
      <p data-reveal className="eyebrow mb-5">
        {eyebrow}
      </p>
      <h2 className={cn("display text-balance text-[clamp(2.4rem,6vw,5.2rem)]", titleClassName)}>
        <SplitWords text={title} />
      </h2>
      {body && (
        <p
          data-reveal
          className={cn("mt-6 max-w-xl text-lg leading-relaxed text-muted text-pretty", align === "center" && "mx-auto")}
        >
          {body}
        </p>
      )}
    </div>
  );
}
