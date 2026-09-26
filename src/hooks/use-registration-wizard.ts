"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  lookupMemberAction,
  saveDraftAction,
  submitRegistrationAction,
} from "@/app/(shell)/campaigns/actions";
import { emptyMember, memberSchema, type DraftMember, type DraftValues } from "@/lib/validation/registration";

const AUTOSAVE_MS = 900;

export type SaveState = "idle" | "saving" | "saved" | "error";

export type WizardOptions = {
  campaignSlug: string;
  initialDraft: DraftValues;
  initialStep: number;
  initialRegistrationId: string | null;
  allowsIndividual: boolean;
  allowsTeam: boolean;
  teamMin: number;
  teamMax: number;
  minClassLevel: number | null;
  maxClassLevel: number | null;
};

type Step = { kind: "type" } | { kind: "member"; index: number } | { kind: "payment" } | { kind: "review" };

const clampCount = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

/**
 * Owns the whole registration form: step state, the debounced autosave into the draft
 * row, the team-mate lookup and the final submit. Components below it only render.
 */
export function useRegistrationWizard(options: WizardOptions) {
  const router = useRouter();

  const [draft, setDraft] = useState<DraftValues>(options.initialDraft);
  const [registrationId, setRegistrationId] = useState<string | null>(options.initialRegistrationId);
  const [step, setStep] = useState(options.initialStep);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [lookupBusy, setLookupBusy] = useState<Record<number, boolean>>({});
  const [lookupErrors, setLookupErrors] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, startSubmit] = useTransition();

  const memberCount = draft.type === "team" ? clampCount(draft.memberCount, options.teamMin, options.teamMax) : 1;

  const steps = useMemo<Step[]>(() => {
    const list: Step[] = [{ kind: "type" }];
    for (let i = 0; i < memberCount; i += 1) list.push({ kind: "member", index: i });
    list.push({ kind: "payment" }, { kind: "review" });
    return list;
  }, [memberCount]);

  const current = steps[Math.min(step, steps.length - 1)] ?? steps[0];
  const stepIndex = Math.min(step, steps.length - 1);

  // Autosave. The first render is the draft we were handed, so it never saves on mount.
  const skipSave = useRef(true);
  const saving = useRef(false);
  const latest = useRef({ draft, step: stepIndex, registrationId });

  useEffect(() => {
    latest.current = { draft, step: stepIndex, registrationId };
  }, [draft, registrationId, stepIndex]);

  const persist = useCallback(async () => {
    if (saving.current || submitted) return;
    saving.current = true;
    setSaveState("saving");

    const snapshot = latest.current;
    const result = await saveDraftAction({
      campaignSlug: options.campaignSlug,
      registrationId: snapshot.registrationId,
      draft: snapshot.draft,
      step: snapshot.step,
    });

    saving.current = false;

    if (result.error || !result.id) {
      setSaveState("error");
      return;
    }
    setRegistrationId((prev) => prev ?? result.id);
    setSaveState("saved");
  }, [options.campaignSlug, submitted]);

  useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    if (submitted) return;

    const id = window.setTimeout(() => void persist(), AUTOSAVE_MS);
    return () => window.clearTimeout(id);
  }, [draft, stepIndex, persist, submitted]);

  const patchDraft = useCallback((patch: Partial<DraftValues>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  const setType = useCallback(
    (type: "individual" | "team") => {
      setDraft((prev) => {
        const count = type === "team" ? clampCount(prev.memberCount, options.teamMin, options.teamMax) : 1;
        const members = [...prev.members];
        while (members.length < count) members.push(emptyMember());
        return { ...prev, type, memberCount: count, members: members.slice(0, Math.max(count, 1)) };
      });
      setErrors({});
    },
    [options.teamMax, options.teamMin],
  );

  const setMemberCount = useCallback(
    (count: number) => {
      setDraft((prev) => {
        const next = clampCount(count, options.teamMin, options.teamMax);
        const members = [...prev.members];
        while (members.length < next) members.push(emptyMember());
        return { ...prev, memberCount: next, members: members.slice(0, next) };
      });
    },
    [options.teamMax, options.teamMin],
  );

  const updateMember = useCallback((index: number, patch: Partial<DraftMember>) => {
    setDraft((prev) => {
      const members = prev.members.map((m, i) => (i === index ? { ...m, ...patch } : m));
      return { ...prev, members };
    });
    setErrors((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(patch)) delete next[`members.${index}.${key}`];
      return next;
    });
  }, []);

  /** Pulls an existing member's own details in. Their profile fields become read-only. */
  const linkMember = useCallback(
    async (index: number, email: string) => {
      setLookupBusy((prev) => ({ ...prev, [index]: true }));
      setLookupErrors((prev) => ({ ...prev, [index]: "" }));

      const result = await lookupMemberAction(email);

      setLookupBusy((prev) => ({ ...prev, [index]: false }));

      if (result.error || !result.member) {
        setLookupErrors((prev) => ({ ...prev, [index]: result.error ?? "No member found." }));
        return false;
      }

      const m = result.member;
      updateMember(index, {
        linkedUserId: m.userId,
        locked: m.locked,
        fullName: m.fullName,
        email: m.email,
        phone: m.phone,
        dob: m.dob,
        institutionId: m.institutionId,
        institutionOther: m.institutionOther,
        institutionName: m.institutionName,
        classLevel: m.classLevel,
        section: m.section,
        roll: m.roll,
        guardianName: m.guardianName,
        guardianPhone: m.guardianPhone,
        address: m.address,
      });
      return true;
    },
    [updateMember],
  );

  const unlinkMember = useCallback(
    (index: number) => {
      setLookupErrors((prev) => ({ ...prev, [index]: "" }));
      updateMember(index, { ...emptyMember() });
    },
    [updateMember],
  );

  const validateMember = useCallback(
    (index: number) => {
      const member = draft.members[index];
      if (!member) return false;

      const parsed = memberSchema.safeParse({
        linkedUserId: member.linkedUserId,
        fullName: member.fullName,
        email: member.email,
        phone: member.phone,
        dob: member.dob,
        institutionId: member.institutionId,
        institutionOther: member.institutionOther,
        classLevel: member.classLevel,
        section: member.section,
        roll: member.roll,
        guardianName: member.guardianName,
        guardianPhone: member.guardianPhone,
        address: member.address,
        consentGuardian: member.consentGuardian === true,
        consentMedia: member.consentMedia === true,
        consentSafety: member.consentSafety === true,
      });

      const next: Record<string, string> = {};
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          next[`members.${index}.${String(issue.path[0] ?? "form")}`] ??= issue.message;
        }
      }

      const level = Number(member.classLevel);
      if (Number.isFinite(level)) {
        if (options.minClassLevel !== null && level < options.minClassLevel) {
          next[`members.${index}.classLevel`] ??= `This campaign starts at class ${options.minClassLevel}`;
        }
        if (options.maxClassLevel !== null && level > options.maxClassLevel) {
          next[`members.${index}.classLevel`] ??= `This campaign stops at class ${options.maxClassLevel}`;
        }
      }

      setErrors((prev) => {
        const cleaned = Object.fromEntries(
          Object.entries(prev).filter(([key]) => !key.startsWith(`members.${index}.`)),
        );
        return { ...cleaned, ...next };
      });

      return Object.keys(next).length === 0;
    },
    [draft.members, options.maxClassLevel, options.minClassLevel],
  );

  const validateStep = useCallback(
    (target: Step) => {
      setFormError(null);

      if (target.kind === "type") {
        if (!draft.type) {
          setErrors((prev) => ({ ...prev, type: "Pick how you are registering" }));
          return false;
        }
        return true;
      }

      if (target.kind === "member") return validateMember(target.index);

      if (target.kind === "payment") {
        const next: Record<string, string> = {};
        if (!draft.payment.method) next["payment.method"] = "Pick the payment method you used";
        if (draft.payment.transactionId.trim().length < 4) {
          next["payment.transactionId"] = "Enter the transaction ID from your payment";
        }
        if (draft.heardFrom === "other" && draft.heardFromOther.trim().length < 2) {
          next.heardFromOther = "Tell us where you heard about us";
        }
        setErrors((prev) => ({ ...prev, ...next }));
        return Object.keys(next).length === 0;
      }

      return true;
    },
    [draft.heardFrom, draft.heardFromOther, draft.payment, draft.type, validateMember],
  );

  const goTo = useCallback(
    (index: number) => {
      setFormError(null);
      setStep(Math.min(Math.max(index, 0), steps.length - 1));
    },
    [steps.length],
  );

  const next = useCallback(() => {
    if (!validateStep(current)) return;
    goTo(stepIndex + 1);
  }, [current, goTo, stepIndex, validateStep]);

  const back = useCallback(() => goTo(stepIndex - 1), [goTo, stepIndex]);

  const submit = useCallback(() => {
    setFormError(null);

    for (const [index, candidate] of steps.entries()) {
      if (candidate.kind === "review") continue;
      if (!validateStep(candidate)) {
        goTo(index);
        return;
      }
    }

    startSubmit(async () => {
      const result = await submitRegistrationAction({
        campaignSlug: options.campaignSlug,
        registrationId: latest.current.registrationId,
        draft: latest.current.draft,
      });

      if (result.fieldErrors) {
        setErrors(result.fieldErrors);
        const first = Object.keys(result.fieldErrors)[0] ?? "";
        const memberMatch = /^members\.(\d+)\./.exec(first);
        if (memberMatch) goTo(Number(memberMatch[1]) + 1);
        else if (first.startsWith("payment") || first.startsWith("heardFrom")) goTo(steps.length - 2);
        else setFormError("Check the highlighted fields and try again.");
        return;
      }

      if (result.error) {
        setFormError(result.error);
        return;
      }

      setSubmitted(true);
      router.refresh();
    });
  }, [goTo, options.campaignSlug, router, steps, validateStep]);

  return {
    draft,
    memberCount,
    steps,
    step: stepIndex,
    current,
    errors,
    formError,
    saveState,
    registrationId,
    submitting,
    submitted,
    lookupBusy,
    lookupErrors,
    setType,
    setMemberCount,
    updateMember,
    patchDraft,
    linkMember,
    unlinkMember,
    goTo,
    next,
    back,
    submit,
  };
}

export type RegistrationWizard = ReturnType<typeof useRegistrationWizard>;
