import { Loader2 } from "lucide-react";

/** Full-width primary submit for the account forms, with a spinner while the action runs. */
export function SubmitButton({
  pending,
  pendingLabel,
  disabled,
  children,
}: {
  pending: boolean;
  pendingLabel: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-fg text-sm font-medium text-bg transition-colors hover:bg-accent hover:text-accent-fg disabled:opacity-60"
    >
      {pending && <Loader2 aria-hidden className="size-4 animate-spin" />}
      {pending ? pendingLabel : children}
    </button>
  );
}
