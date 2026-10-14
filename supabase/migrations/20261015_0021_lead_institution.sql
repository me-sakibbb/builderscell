-- Leads gain the student's institution: picked from the institutions catalogue, or typed
-- in when it is not listed. Exactly one of the two is set, as on registration_members.
--
-- submit_lead() and admin_list_leads() change signature and return type, so both are
-- dropped and recreated.

alter table public.leads
  add column institution_id    uuid references public.institutions (id) on delete set null,
  add column institution_other text,
  add constraint leads_one_institution check (
    (institution_id is not null) <> (btrim(coalesce(institution_other, '')) <> '')
  ),
  add constraint leads_institution_other_length check (
    institution_other is null or char_length(btrim(institution_other)) between 2 and 120
  );

comment on column public.leads.institution_id is 'Institution picked from the catalogue. Null when typed in.';
comment on column public.leads.institution_other is 'Institution typed in when it is not in the catalogue.';

create index leads_institution on public.leads (institution_id);

drop function public.submit_lead(text, text, text, text, text);

create function public.submit_lead(
  p_event             text,
  p_full_name         text,
  p_phone             text,
  p_email             text,
  p_grade             text,
  p_institution_id    uuid,
  p_institution_other text
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_event_id uuid;
  v_other    text := case when p_institution_id is null then nullif(btrim(coalesce(p_institution_other, '')), '') end;
begin
  select e.id into v_event_id
  from public.lead_events e
  where e.slug = p_event and e.is_open;

  if v_event_id is null then
    raise exception 'lead_event_closed';
  end if;

  insert into public.leads (event_id, full_name, phone, email, grade, institution_id, institution_other)
  values (v_event_id, btrim(p_full_name), btrim(p_phone), lower(btrim(p_email)), p_grade, p_institution_id, v_other)
  on conflict (event_id, phone) do update
    set full_name         = excluded.full_name,
        email             = excluded.email,
        grade             = excluded.grade,
        institution_id    = excluded.institution_id,
        institution_other = excluded.institution_other;
exception
  when check_violation or not_null_violation or foreign_key_violation then
    raise exception 'invalid_lead';
end;
$$;

comment on function public.submit_lead is 'Saves a landing page lead for an open event. A repeat phone at the same event updates the earlier lead.';

revoke execute on function public.submit_lead(text, text, text, text, text, uuid, text) from public;
grant execute on function public.submit_lead(text, text, text, text, text, uuid, text) to anon, authenticated;

drop function public.admin_list_leads(uuid, text, text, integer, integer);

-- Paginated, searchable, filterable lead list. p_contacted is 'yes', 'no' or null for both.
create function public.admin_list_leads(
  p_event     uuid default null,
  p_contacted text default null,
  p_q         text default '',
  p_limit     integer default 20,
  p_offset    integer default 0
)
returns table (
  id               uuid,
  event_id         uuid,
  event_title      text,
  full_name        text,
  phone            text,
  email            text,
  grade            text,
  institution_name text,
  contacted_at     timestamptz,
  created_at       timestamptz,
  total_count      bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_q text := nullif(btrim(coalesce(p_q, '')), '');
begin
  if not public.is_admin() then
    raise exception 'not_authorised';
  end if;

  return query
    select
      l.id, l.event_id, e.title, l.full_name, l.phone, l.email, l.grade,
      coalesce(i.name, l.institution_other),
      l.contacted_at, l.created_at,
      count(*) over ()
    from public.leads l
    join public.lead_events e on e.id = l.event_id
    left join public.institutions i on i.id = l.institution_id
    where (p_event is null or l.event_id = p_event)
      and (
        p_contacted is null
        or (p_contacted = 'yes' and l.contacted_at is not null)
        or (p_contacted = 'no' and l.contacted_at is null)
      )
      and (
        v_q is null
        or l.full_name ilike '%' || v_q || '%'
        or l.email ilike '%' || v_q || '%'
        or l.phone ilike '%' || v_q || '%'
        or coalesce(i.name, l.institution_other) ilike '%' || v_q || '%'
      )
    order by l.created_at desc, l.id
    limit greatest(1, least(coalesce(p_limit, 20), 1000))
    offset greatest(0, coalesce(p_offset, 0));
end;
$$;

comment on function public.admin_list_leads is 'Paginated, searchable lead list, filterable by event and contacted state. Admins only.';

revoke execute on function public.admin_list_leads(uuid, text, text, integer, integer) from public, anon;
grant execute on function public.admin_list_leads(uuid, text, text, integer, integer) to authenticated;
