import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";

type Props = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "ghost";
  size?: "md" | "lg";
  className?: string;
  arrow?: boolean;
};

/** Link-button; in-app hrefs route through Link so they don't reload the page, "#..." stays a plain anchor. */
export function Button({ href, children, variant = "primary", size = "md", className, arrow = true }: Props) {
  const Anchor = href.startsWith("/") ? Link : "a";

  return (
    <Anchor
      href={href}
      className={cn(
        "group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full font-medium whitespace-nowrap",
        "transition-[color,background-color,border-color,opacity] duration-300 ease-out-expo active:opacity-90",
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
    </Anchor>
  );
}
