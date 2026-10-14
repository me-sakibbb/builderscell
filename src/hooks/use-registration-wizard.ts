"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  lookupMemberAction,
  previewCouponAction,
  saveDraftAction,
  submitRegistrationAction,
} from "@/app/(shell)/campaigns/actions";
import type { CouponQuote } from "@/lib/queries/coupons";
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
  individualFee: number | null;
  teamFee: number | null;
};

/** A quote is only good for the registration type it was priced for. */
type AppliedCoupon = CouponQuote & { type: "individual" | "team" };

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
  const [couponInput, setCouponInput] = useState(options.initialDraft.couponCode);
  const [applied, setApplied] = useState<AppliedCoupon | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);

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

  // Coupon. The draft only ever stores a code Postgres accepted; the price shown comes
  // from the last quote, and only while it was priced for the current registration type.
  const listedFee =
    draft.type === "team" ? options.teamFee : draft.type === "individual" ? options.individualFee : null;
  const coupon = applied && applied.type === draft.type && applied.code === draft.couponCode ? applied : null;
  const fee = coupon ? coupon.finalFee : listedFee;
  const couponChecking = couponBusy || (Boolean(draft.couponCode) && Boolean(draft.type) && !coupon);

  const quoteRequest = useRef(0);

  const requestQuote = useCallback(
    async (code: string, type: "individual" | "team") => {
      const request = ++quoteRequest.current;
      const result = await previewCouponAction({ campaignSlug: options.campaignSlug, type, code });
      // A newer request (or a removal) has superseded this one.
      if (request !== quoteRequest.current) return null;
      return result;
    },
    [options.campaignSlug],
  );

  const applyCoupon = useCallback(async () => {
    const code = couponInput.trim().toUpperCase();
    setCouponError("");
    setErrors((prev) => {
      const next = { ...prev };
      delete next.couponCode;
      return next;
    });

    if (!code) {
      setCouponError("Enter a coupon code.");
      return;
    }
    if (!draft.type) {
      setCouponError("Pick how you are registering first.");
      return;
    }

    setCouponBusy(true);
    const result = await requestQuote(code, draft.type);
    setCouponBusy(false);
    if (!result) return;

    if (result.error || !result.quote) {
      setApplied(null);
      setCouponError(result.error ?? "That coupon code is not valid.");
      patchDraft({ couponCode: "" });
      return;
    }

    setApplied({ ...result.quote, type: draft.type });
    setCouponInput(result.quote.code);
    patchDraft({ couponCode: result.quote.code });
  }, [couponInput, draft.type, patchDraft, requestQuote]);

  const changeCouponInput = useCallback((value: string) => {
    setCouponInput(value.toUpperCase());
    setCouponError("");
    setErrors((prev) => {
      if (!prev.couponCode) return prev;
      const next = { ...prev };
      delete next.couponCode;
      return next;
    });
  }, []);

  const removeCoupon = useCallback(() => {
    quoteRequest.current += 1;
    setCouponBusy(false);
    setApplied(null);
    setCouponInput("");
    setCouponError("");
    setErrors((prev) => {
      const next = { ...prev };
      delete next.couponCode;
      return next;
    });
    patchDraft({ couponCode: "" });
  }, [patchDraft]);

  // Re-price a saved code when the draft is reopened or the registration type changes.
  // If it no longer applies, it comes off and the member is told why.
  const requoteTarget = draft.couponCode && draft.type ? `${draft.type}:${draft.couponCode}` : null;
  const appliedKey = applied ? `${applied.type}:${applied.code}` : null;

  useEffect(() => {
    if (!requoteTarget || requoteTarget === appliedKey) return;
    const [type, code] = requoteTarget.split(":") as ["individual" | "team", string];

    let cancelled = false;
    void requestQuote(code, type).then((result) => {
      if (cancelled || !result) return;
      if (result.error || !result.quote) {
        setApplied(null);
        setCouponError(`${code} was removed: ${result.error ?? "it no longer applies."}`);
        patchDraft({ couponCode: "" });
        return;
      }
      setApplied({ ...result.quote, type });
    });

    return () => {
      cancelled = true;
    };
  }, [appliedKey, patchDraft, requestQuote, requoteTarget]);

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
        // A typed but unapplied code would leave the member unsure what they owe.
        if (couponChecking) {
          next.couponCode = "Wait a moment while the coupon is checked";
        } else if (couponInput.trim() && couponInput.trim().toUpperCase() !== draft.couponCode) {
          next.couponCode = "Apply this coupon, or clear the field";
        }
        setErrors((prev) => ({ ...prev, ...next }));
        return Object.keys(next).length === 0;
      }

      return true;
    },
    [couponChecking, couponInput, draft.couponCode, draft.heardFrom, draft.heardFromOther, draft.payment, draft.type, validateMember],
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

        // The coupon stopped applying after it was quoted: take it off so the price shown
        // is the one that would now be charged.
        if (first === "couponCode") {
          quoteRequest.current += 1;
          setApplied(null);
          patchDraft({ couponCode: "" });
        }

        if (memberMatch) goTo(Number(memberMatch[1]) + 1);
        else if (first.startsWith("payment") || first.startsWith("heardFrom") || first === "couponCode") {
          goTo(steps.length - 2);
        } else setFormError("Check the highlighted fields and try again.");
        return;
      }

      if (result.error) {
        setFormError(result.error);
        return;
      }

      setSubmitted(true);
      router.refresh();
    });
  }, [goTo, options.campaignSlug, patchDraft, router, steps, validateStep]);

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
    listedFee,
    fee,
    coupon,
    couponInput,
    couponChecking,
    couponError: errors.couponCode || couponError,
    changeCouponInput,
    applyCoupon,
    removeCoupon,
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
