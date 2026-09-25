export function AuthCard({
  eyebrow,
  title,
  lead,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl hairline glass p-6 shadow-[0_30px_80px_-40px_rgb(0_0_0/0.5)] sm:p-8">
      <p className="eyebrow mb-5">{eyebrow}</p>
      <h1 className="display text-3xl text-balance sm:text-4xl">{title}</h1>
      <p className="mt-3 text-muted">{lead}</p>
      <div className="mt-7">{children}</div>
      {footer && <div className="mt-6 border-t border-line pt-5 text-sm text-muted">{footer}</div>}
    </div>
  );
}

export function OrDivider() {
  return (
    <div className="my-5 flex items-center gap-3">
      <span className="h-px flex-1 bg-line" />
      <span className="font-mono text-[11px] tracking-widest text-muted uppercase">or</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
