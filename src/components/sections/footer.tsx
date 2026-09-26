import { credits, footer } from "@/content/site";
import { Wordmark } from "@/components/ui/wordmark";

export function Footer() {
  return (
    <footer className="relative z-10 overflow-hidden border-t border-line bg-bg-elev pt-20">
      <div className="container-x">
        <div className="grid gap-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Wordmark className="text-2xl" />
            <p className="mt-4 max-w-xs text-muted">{footer.tagline}</p>
          </div>
          {footer.columns.map((c) => (
            <div key={c.title}>
              <h3 className="mb-4 label text-muted">{c.title}</h3>
              <ul className="space-y-2">
                {c.items.map((i) => (
                  <li key={i.label}>
                    <a href={i.href} className="transition-colors hover:text-accent-ink">
                      {i.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <details className="group mt-16 border-t border-line py-6">
          <summary className="flex cursor-pointer list-none items-center justify-between label text-muted">
            Asset credits
            <span className="transition-transform group-open:rotate-45">+</span>
          </summary>
          <ul className="mt-5 grid gap-x-8 gap-y-2 text-sm text-muted sm:grid-cols-2">
            {credits.map((c) => (
              <li key={c.href}>
                <a href={c.href} target="_blank" rel="noreferrer" className="hover:text-fg">
                  {c.what}
                </a>{" "}
                by {c.who}, {c.license}
              </li>
            ))}
          </ul>
        </details>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line py-6 text-xs text-muted">
          <span>© {new Date().getFullYear()} Builder&apos;s Cell</span>
          <span>Made in Bangladesh</span>
        </div>
      </div>
      {/* oversized wordmark bleeding off the bottom edge */}
      <div aria-hidden className="pointer-events-none -mb-[4vw] overflow-hidden text-center text-[16.5vw] leading-[0.8] opacity-[0.06]">
        <Wordmark />
      </div>
    </footer>
  );
}
