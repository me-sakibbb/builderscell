import { AuthHeader } from "@/components/auth/auth-header";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="relative flex min-h-dvh flex-col bg-bg">
      <div aria-hidden className="pointer-events-none absolute inset-0 blueprint [mask-image:radial-gradient(ellipse_at_top,black,transparent_75%)]" />
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 size-[70vmin] -translate-x-1/2 rounded-full opacity-60 blur-[110px]" style={{ background: "radial-gradient(circle, var(--glow), transparent 65%)" }} />
      <div className="relative">
        <AuthHeader />
      </div>
      <main className="relative flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
