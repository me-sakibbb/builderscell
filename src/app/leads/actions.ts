"use server";

import { revalidatePath } from "next/cache";
import { submitLead } from "@/lib/queries/leads";
import { leadErrorMessage, leadSchema } from "@/lib/validation/lead";

export type SubmitLeadResult = {
  ok?: boolean;
  error?: string;
  /** Keyed by the form field, e.g. `phone`. */
  fieldErrors?: Record<string, string>;
};

/** The landing page lead form. Open to visitors without an account. */
export async function submitLeadAction(input: { event: string; values: unknown; trap: string }): Promise<SubmitLeadResult> {
  // Hidden field only a bot would fill. Pretend it worked so it does not retry.
  if (input.trap) return { ok: true };

  const parsed = leadSchema.safeParse(input.values);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0] ?? "form")] ??= issue.message;
    }
    return { fieldErrors };
  }

  const { error } = await submitLead(input.event, parsed.data);
  if (error) return { error: leadErrorMessage(error) };

  revalidatePath("/admin/leads");
  return { ok: true };
}
