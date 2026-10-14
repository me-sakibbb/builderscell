"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, isCurrentUserAdmin } from "@/lib/queries/profile";
import { setLeadContacted } from "@/lib/queries/leads";
import { leadErrorMessage } from "@/lib/validation/lead";

export type LeadActionState = { ok?: boolean; error?: string };

/** Marks a lead as contacted, or clears it. The database re-checks that the caller is an admin. */
export async function toggleLeadContactedAction(_prev: LeadActionState, formData: FormData): Promise<LeadActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Your session expired. Sign in again." };
  if (!(await isCurrentUserAdmin())) return { error: "You do not have access to this." };

  const id = String(formData.get("leadId") ?? "");
  const contacted = formData.get("contacted") === "true";
  if (!id) return { error: "Pick a lead." };

  const { error } = await setLeadContacted(id, contacted);
  if (error) return { error: leadErrorMessage(error, "Could not update this lead. Try again in a moment.") };

  revalidatePath("/admin/leads");
  return { ok: true };
}
