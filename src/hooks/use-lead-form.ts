"use client";

import { useCallback, useState, useTransition } from "react";
import { submitLeadAction } from "@/app/leads/actions";
import type { InstitutionValue } from "@/components/auth/institution-select";
import { emptyLeadForm, type LeadFormValues } from "@/lib/validation/lead";

/**
 * Owns the landing page lead form: field state, the hidden bot trap, and the submit.
 * The section component only renders.
 */
export function useLeadForm(event: string) {
  const [values, setValues] = useState<LeadFormValues>(emptyLeadForm);
  const [trap, setTrap] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [sending, startSend] = useTransition();

  const setField = useCallback(<K extends keyof LeadFormValues>(key: K, value: LeadFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  /** The institution picker sets its three fields together. */
  const setInstitution = useCallback((next: InstitutionValue) => {
    setValues((prev) => ({ ...prev, ...next }));
    setErrors((prev) => {
      if (!("institutionId" in prev)) return prev;
      const rest = { ...prev };
      delete rest.institutionId;
      return rest;
    });
  }, []);

  const submit = useCallback(() => {
    setFormError(null);

    startSend(async () => {
      const result = await submitLeadAction({ event, values, trap }).catch(() => null);

      if (!result) {
        setFormError("Could not reach the server. Check your connection and try again.");
        return;
      }
      if (result.fieldErrors) {
        setErrors(result.fieldErrors);
        return;
      }
      if (result.error) {
        setFormError(result.error);
        return;
      }

      setErrors({});
      setSent(true);
    });
  }, [event, values, trap]);

  /** Clears the form for the next student at the stall. */
  const reset = useCallback(() => {
    setValues(emptyLeadForm());
    setErrors({});
    setFormError(null);
    setSent(false);
  }, []);

  return { values, setField, setInstitution, trap, setTrap, errors, formError, sent, sending, submit, reset };
}
