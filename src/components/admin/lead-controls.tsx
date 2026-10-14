"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { toggleLeadContactedAction, type LeadActionState } from "@/app/(admin)/admin/leads/actions";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/cn";

const EMPTY: LeadActionState = {};

/** The contacted switch. Submits straight away; the page re-renders with the result. */
export function LeadContactedToggle({
  leadId,
  contacted,
  name,
  className,
}: {
  leadId: string;
  contacted: boolean;
  name: string;
  className?: string;
}) {
  const [state, action, pending] = useActionState(toggleLeadContactedAction, EMPTY);

  return (
    <form action={action} className={cn("flex flex-col items-end gap-1", className)}>
      <input type="hidden" name="leadId" value={leadId} />
      <input type="hidden" name="contacted" value={String(!contacted)} />
      <div className="flex items-center gap-2">
        {pending && <Loader2 aria-hidden className="size-4 animate-spin text-muted" />}
        <span className="label-xs text-muted">{contacted ? "Contacted" : "Not yet"}</span>
        <Switch
          type="submit"
          checked={contacted}
          disabled={pending}
          aria-label={contacted ? `Mark ${name} as not contacted` : `Mark ${name} as contacted`}
        />
      </div>
      {state.error && (
        <p role="alert" className="max-w-56 text-right text-xs text-signal">
          {state.error}
        </p>
      )}
    </form>
  );
}
