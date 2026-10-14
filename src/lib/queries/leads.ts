import { createClient } from "@/lib/supabase/server";
import { LEAD_CONTACTED, type LeadContacted, type LeadPayload } from "@/lib/validation/lead";

/** Every read and write on leads lives here. Visitors only reach the table through
 *  submit_lead(); everything else is admin-only in the database. */

export const LEADS_PAGE_SIZE = 20;
/** Rows fetched per round trip when exporting every lead. */
const EXPORT_BATCH = 1000;

export async function submitLead(event: string, lead: LeadPayload) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_lead", {
    p_event: event,
    p_full_name: lead.fullName,
    p_phone: lead.phone,
    p_email: lead.email,
    p_grade: lead.grade,
    // The generated types mark these required strings; null is how "none" is sent.
    p_institution_id: lead.institutionId as unknown as string,
    p_institution_other: (lead.institutionOther || null) as unknown as string,
  });
  return { error: error?.message ?? null };
}

export type LeadFilters = { eventId: string | null; contacted: LeadContacted | null; query: string };

async function fetchLeads(filters: LeadFilters, limit: number, offset: number) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_list_leads", {
    // The generated types mark these optional strings; null is how "any" is asked for.
    p_event: filters.eventId as unknown as string,
    p_contacted: filters.contacted as unknown as string,
    p_q: filters.query,
    p_limit: limit,
    p_offset: offset,
  });
  return { items: data ?? [], error: error?.message ?? null };
}

/** Leads newest first, one page at a time. */
export async function listLeads(params: LeadFilters & { page: number; pageSize?: number }) {
  const pageSize = params.pageSize ?? LEADS_PAGE_SIZE;
  const current = Math.max(1, params.page);
  const { items, error } = await fetchLeads(params, pageSize, (current - 1) * pageSize);
  const total = Number(items[0]?.total_count ?? 0);

  return {
    items,
    total,
    page: current,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    error,
  };
}

export type LeadRow = Awaited<ReturnType<typeof listLeads>>["items"][number];

/** Every lead matching the filters, for the CSV export. Read in batches. */
export async function listAllLeads(filters: LeadFilters) {
  const all: LeadRow[] = [];
  for (let offset = 0; ; offset += EXPORT_BATCH) {
    const { items, error } = await fetchLeads(filters, EXPORT_BATCH, offset);
    if (error) return { items: all, error };
    all.push(...items);
    if (items.length < EXPORT_BATCH) return { items: all, error: null };
  }
}

/** Events for the admin filter, with their lead counts. */
export async function listLeadEvents() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_list_lead_events");
  return data ?? [];
}

export type LeadEventOption = Awaited<ReturnType<typeof listLeadEvents>>[number];

/** Reads the list's URL filters (event slug, contacted, q) into query filters. Shared by
 *  the admin page and the CSV export, so both always agree on what is selected. */
export async function resolveLeadFilters(search: { event: string; contacted: string; q: string }) {
  const events = await listLeadEvents();
  const event = events.find((row) => row.slug === search.event) ?? null;
  const contacted = (LEAD_CONTACTED as readonly string[]).includes(search.contacted)
    ? (search.contacted as LeadContacted)
    : null;

  const filters: LeadFilters = { eventId: event?.id ?? null, contacted, query: search.q.trim() };
  return { events, event, filters };
}

export async function setLeadContacted(id: string, contacted: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_lead_contacted", { p_id: id, p_contacted: contacted });
  return { error: error?.message ?? null };
}
