"use client";

import { useActionState, useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { reviewRegistrationAction, type ReviewState } from "@/app/(shell)/admin/actions";
import { FormError, inputClass } from "@/components/ui/field";
import { cn } from "@/lib/cn";

const EMPTY: ReviewState = {};

/** Approve or reject, with the note that the member will read on their own page. */
export function ReviewForm({ registrationId, status }: { registrationId: string; status: string }) {
  const [state, action, pending] = useActionState(reviewRegistrationAction, EMPTY);
  const [note, setNote] = useState("");

  return (
    <form action={action} className="space-y-4 rounded-2xl hairline bg-surface/60 p-5">
      <input type="hidden" name="registrationId" value={registrationId} />

      <div>
        <label htmlFor="note" className="block text-sm font-medium text-fg">
          Note to the registrant
        </label>
        <p className="mt-1 text-sm text-muted">Required when you reject. Shown on their registration page.</p>
        <textarea
          id="note"
          name="note"
          rows={3}
          maxLength={500}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className={cn(inputClass, "mt-2 h-auto py-3 leading-relaxed")}
        />
      </div>

      <FormError>{state.error}</FormError>

      {state.ok && (
        <p role="status" className="rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent-ink">
          Saved.
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          name="action"
          value="approve"
          disabled={pending || status === "approved"}
          className="inline-flex h-12 items-center gap-2 rounded-xl bg-fg px-6 text-sm font-medium text-bg transition-colors hover:bg-accent hover:text-accent-fg disabled:opacity-60"
        >
          {pending ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Check aria-hidden className="size-4" />}
          Approve
        </button>

        <button
          type="submit"
          name="action"
          value="reject"
          disabled={pending || status === "rejected"}
          className="inline-flex h-12 items-center gap-2 rounded-xl border border-signal/40 px-6 text-sm font-medium text-signal transition-colors hover:bg-signal/10 disabled:opacity-60"
        >
          <X aria-hidden className="size-4" />
          Reject
        </button>
      </div>
    </form>
  );
}
