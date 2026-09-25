"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { nav } from "@/content/site";
import { Wordmark } from "@/components/ui/wordmark";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { AccountButton } from "@/components/auth/account-button";
import { useUser } from "@/hooks/use-user";
import { useLenis } from "@/components/smooth-scroll";
import { cn } from "@/lib/cn";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const lenis = useLenis();
  const { user } = useUser();

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      // Tuck the bar away while reading downward, bring it back on any upward scroll.
      setHidden(y > 600 && y > last + 4);
      if (y < last - 4) setHidden(false);
      last = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (open) lenis?.stop();
    else lenis?.start();
    document.documentElement.style.overflow = open ? "hidden" : "";
  }, [open, lenis]);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 transition-transform duration-500 ease-out-expo sm:pt-4",
          hidden && !open && "-translate-y-[120%]",
        )}
      >
        <nav
          aria-label="Main"
          className={cn(
            "flex w-full items-center justify-between rounded-full transition-all duration-500 ease-out-expo",
            scrolled || open
              ? "glass hairline max-w-5xl py-1.5 pr-1.5 pl-5 shadow-[0_8px_40px_-12px_rgb(0_0_0/0.25)]"
              : "max-w-7xl border border-transparent py-3 pr-2 pl-4",
          )}
        >
          <a href="#top" className="text-xl" aria-label="Builder's Cell home">
            <Wordmark />
          </a>
          <ul className="hidden items-center gap-1 lg:flex">
            {nav.links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="rounded-full px-3.5 py-2 text-sm text-muted transition-colors hover:bg-surface hover:text-fg"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-2">
            <span className="hidden sm:block">
              <AccountButton />
            </span>
            <ThemeToggle />
            <span className="hidden sm:block">
              <Button href={nav.cta.href} arrow={false}>
                {nav.cta.label}
              </Button>
            </span>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              className="grid size-10 place-items-center rounded-full hairline lg:hidden"
            >
              {open ? <X className="size-[18px]" /> : <Menu className="size-[18px]" />}
            </button>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ clipPath: "circle(0% at calc(100% - 40px) 40px)" }}
            animate={{ clipPath: "circle(150% at calc(100% - 40px) 40px)" }}
            exit={{ clipPath: "circle(0% at calc(100% - 40px) 40px)" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-40 flex flex-col justify-end bg-bg px-6 pb-10 blueprint lg:hidden"
          >
            <ul className="space-y-1">
              {[...nav.links, nav.cta, user ? { label: "Your profile", href: "/profile" } : { label: "Sign in", href: "/login" }].map((l, i) => (
                <motion.li
                  key={l.href + l.label}
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15 + i * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                  <a
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="flex items-baseline gap-4 py-2 text-5xl font-semibold tracking-tight"
                  >
                    <span className="font-mono text-xs text-muted">0{i + 1}</span>
                    {l.label}
                  </a>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
