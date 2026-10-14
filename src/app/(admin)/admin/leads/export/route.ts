import type { NextRequest } from "next/server";
import { getCurrentUser, isCurrentUserAdmin } from "@/lib/queries/profile";
import { listAllLeads, resolveLeadFilters } from "@/lib/queries/leads";
import { gradeLabel, leadDateTime } from "@/lib/validation/lead";

/** Quotes a CSV cell. Free-text cells starting with a formula character are prefixed so a
 *  spreadsheet shows them as text instead of running them. */
function cell(value: string, freeText = false) {
  const safe = freeText && /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

/** Every lead matching the list's filters, as a CSV download. The admin layout does not
 *  wrap route handlers, so the caller is checked here, and the database checks again. */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return new Response("Sign in again.", { status: 401 });
  if (!(await isCurrentUserAdmin())) return new Response("Not found.", { status: 404 });

  const params = request.nextUrl.searchParams;
  const { event, filters } = await resolveLeadFilters({
    event: params.get("event") ?? "",
    contacted: params.get("contacted") ?? "",
    q: params.get("q") ?? "",
  });

  const { items, error } = await listAllLeads(filters);
  if (error) return new Response(`Could not export leads: ${error}`, { status: 500 });

  const header = ["Name", "Phone", "Email", "Institution", "Class/Grade", "Event", "Submitted", "Contacted"];
  const rows = items.map((row) =>
    [
      cell(row.full_name, true),
      cell(row.phone),
      cell(row.email, true),
      cell(row.institution_name ?? "", true),
      cell(gradeLabel(row.grade)),
      cell(row.event_title),
      cell(leadDateTime.format(new Date(row.created_at))),
      cell(row.contacted_at ? leadDateTime.format(new Date(row.contacted_at)) : ""),
    ].join(","),
  );

  // The byte-order mark lets Excel read names in Bangla correctly.
  const csv = "﻿" + [header.map((h) => cell(h)).join(","), ...rows].join("\r\n");
  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `leads-${event?.slug ?? "all"}-${stamp}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
