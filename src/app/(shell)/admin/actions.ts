"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, isCurrentUserAdmin } from "@/lib/queries/profile";
import { reviewRegistration } from "@/lib/queries/registrations";
import { submitErrorMessage } from "@/lib/validation/registration";

export type ReviewState = { ok?: boolean; error?: string };

/** Approve or reject. The database re-checks that the caller is an admin. */
export async function reviewRegistrationAction(_prev: ReviewState, formData: FormData): Promise<ReviewState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Your session expired. Sign in again." };
  if (!(await isCurrentUserAdmin())) return { error: "You do not have access to this." };

  const registrationId = String(formData.get("registrationId") ?? "");
  const action = String(formData.get("action") ?? "");
  const note = String(formData.get("note") ?? "").trim().slice(0, 500);

  if (!registrationId) return { error: "Pick a registration to review." };
  if (action !== "approve" && action !== "reject") return { error: "Pick approve or reject." };
  if (action === "reject" && note.length < 3) {
    return { error: "Add a short note saying why this was not accepted." };
  }

  const { error } = await reviewRegistration(registrationId, action, note);
  if (error) return { error: submitErrorMessage(error) };

  revalidatePath("/admin/registrations");
  revalidatePath(`/admin/registrations/${registrationId}`);
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}
