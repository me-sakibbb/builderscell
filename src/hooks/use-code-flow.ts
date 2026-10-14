import { useActionState, useState } from "react";
import type { AuthState } from "@/app/auth/actions";

type Action = (prev: AuthState, formData: FormData) => Promise<AuthState>;

const EMPTY: AuthState = {};

/**
 * The "email first, then a code" step machine. `back` returns to the email step without
 * resetting the action; the next send produces a new state object, which moves forward again.
 */
export function useCodeFlow(action: Action) {
  const [state, formAction, pending] = useActionState(action, EMPTY);
  const [dismissed, setDismissed] = useState<AuthState | null>(null);

  return {
    state,
    formAction,
    pending,
    email: state.email ?? "",
    onCode: Boolean(state.sent) && state !== dismissed,
    back: () => setDismissed(state),
  };
}

export { EMPTY as EMPTY_AUTH_STATE };
