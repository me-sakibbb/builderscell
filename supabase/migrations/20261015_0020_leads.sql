-- Leads: contact details visitors leave on the landing page at an outreach event, such
-- as a school STEM fest. No account is needed. Every lead is tagged with the event it
-- came from, so the same form can be pointed at the next event.
--
-- Visitors never touch the tables: submit_lead() is the only way in, and it only
-- accepts leads for an event that is switched on. Admins read the list through
-- admin_list_leads() and mark follow-ups with admin_set_lead_contacted().

create table public.lead_events (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null,
  title      text not null,
  venue      text,
  starts_at  timestamptz,
  ends_at    timestamptz,
  is_open    boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lead_events_slug_format check (slug ~ '^[a-z0-9][a-z0-9-]{1,63}$'),
  constraint lead_events_title_length check (char_length(btrim(title)) between 2 and 120),
  constraint lead_events_window check (starts_at is null or ends_at is null or ends_at > starts_at)
);

comment on table public.lead_events is 'Outreach events the landing page collects leads for. Admin-only; visitors reach them only through submit_lead().';
comment on column public.lead_events.is_open is 'Whether submit_lead() accepts new leads for this event.';

create unique index lead_events_slug_key on public.lead_events (slug);

create trigger lead_events_touch_updated_at
  before update on public.lead_events
  for each row execute function public.touch_updated_at();

create table public.leads (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references public.lead_events (id) on delete restrict,
  full_name    text not null,
  phone        text not null,
  email        text not null,
  grade        text not null,
  contacted_at timestamptz,
  contacted_by uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint leads_full_name_length check (char_length(btrim(full_name)) between 2 and 80),
  constraint leads_phone_format check (phone ~ '^\+8801[3-9][0-9]{8}$'),
  constraint leads_email_format check (char_length(email) <= 254 and email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  constraint leads_grade check (
    grade in ('class_6','class_7','class_8','class_9','class_10','class_11','class_12','o_level','a_level','other')
  )
);

comment on table public.leads is 'Contact details left on the landing page at an outreach event. Written only by submit_lead().';
comment on column public.leads.phone is 'Bangladeshi mobile, stored as +8801XXXXXXXXX. One lead per phone per event.';
comment on column public.leads.grade is 'Class or grade picked from a fixed list, e.g. class_9 or o_level.';
comment on column public.leads.contacted_at is 'When an admin marked this lead as contacted. Null means not yet.';

-- A second submission with the same phone at the same event updates the first.
create unique index leads_event_phone_key on public.leads (event_id, phone);
create index leads_event_created_at on public.leads (event_id, created_at desc);
create index leads_created_at on public.leads (created_at desc);
create index leads_contacted_by on public.leads (contacted_by);

create trigger leads_touch_updated_at
  before update on public.leads
  for each row execute function public.touch_updated_at();

alter table public.lead_events enable row level security;
alter table public.leads enable row level security;

revoke all on public.lead_events from anon;
revoke all on public.leads from anon;
revoke insert, update, delete on public.lead_events from authenticated;
revoke insert, update, delete on public.leads from authenticated;

create policy "lead events are readable by admins"
  on public.lead_events for select
  to authenticated
  using (public.is_admin());

create policy "leads are readable by admins"
  on public.leads for select
  to authenticated
  using (public.is_admin());

-- The landing page form. Open to visitors without an account.
create function public.submit_lead(
  p_event     text,
  p_full_name text,
  p_phone     text,
  p_email     text,
  p_grade     text
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_event_id uuid;
begin
  select e.id into v_event_id
  from public.lead_events e
  where e.slug = p_event and e.is_open;

  if v_event_id is null then
    raise exception 'lead_event_closed';
  end if;

  insert into public.leads (event_id, full_name, phone, email, grade)
  values (v_event_id, btrim(p_full_name), btrim(p_phone), lower(btrim(p_email)), p_grade)
  on conflict (event_id, phone) do update
    set full_name = excluded.full_name,
        email     = excluded.email,
        grade     = excluded.grade;
exception
  when check_violation or not_null_violation then
    raise exception 'invalid_lead';
end;
$$;

comment on function public.submit_lead is 'Saves a landing page lead for an open event. A repeat phone at the same event updates the earlier lead.';

revoke execute on function public.submit_lead(text, text, text, text, text) from public;
grant execute on function public.submit_lead(text, text, text, text, text) to anon, authenticated;

-- Events for the admin filter, newest first.
create function public.admin_list_lead_events()
returns table (id uuid, slug text, title text, is_open boolean, lead_count bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_authorised';
  end if;

  return query
    select e.id, e.slug, e.title, e.is_open, (select count(*) from public.leads l where l.event_id = e.id)
    from public.lead_events e
    order by coalesce(e.starts_at, e.created_at) desc;
end;
$$;

comment on function public.admin_list_lead_events is 'Lead events with their lead counts, for the admin filter. Admins only.';

revoke execute on function public.admin_list_lead_events() from public, anon;
grant execute on function public.admin_list_lead_events() to authenticated;

-- Paginated, searchable, filterable lead list. p_contacted is 'yes', 'no' or null for both.
create function public.admin_list_leads(
  p_event     uuid default null,
  p_contacted text default null,
  p_q         text default '',
  p_limit     integer default 20,
  p_offset    integer default 0
)
returns table (
  id           uuid,
  event_id     uuid,
  event_title  text,
  full_name    text,
  phone        text,
  email        text,
  grade        text,
  contacted_at timestamptz,
  created_at   timestamptz,
  total_count  bigint
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
      l.id, l.event_id, e.title, l.full_name, l.phone, l.email, l.grade, l.contacted_at, l.created_at,
      count(*) over ()
    from public.leads l
    join public.lead_events e on e.id = l.event_id
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
      )
    order by l.created_at desc, l.id
    limit greatest(1, least(coalesce(p_limit, 20), 1000))
    offset greatest(0, coalesce(p_offset, 0));
end;
$$;

comment on function public.admin_list_leads is 'Paginated, searchable lead list, filterable by event and contacted state. Admins only.';

revoke execute on function public.admin_list_leads(uuid, text, text, integer, integer) from public, anon;
grant execute on function public.admin_list_leads(uuid, text, text, integer, integer) to authenticated;

create function public.admin_set_lead_contacted(p_id uuid, p_contacted boolean)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_authorised';
  end if;

  update public.leads
  set contacted_at = case when p_contacted then coalesce(contacted_at, now()) end,
      contacted_by = case when p_contacted then coalesce(contacted_by, auth.uid()) end
  where id = p_id;

  if not found then
    raise exception 'lead_not_found';
  end if;
end;
$$;

comment on function public.admin_set_lead_contacted is 'Marks a lead as contacted, or clears it. Admins only.';

revoke execute on function public.admin_set_lead_contacted(uuid, boolean) from public, anon;
grant execute on function public.admin_set_lead_contacted(uuid, boolean) to authenticated;

-- The first event: Manarat STEM Fest 2026-27, hosted by Manarat Science Club.
insert into public.lead_events (slug, title, venue, starts_at, ends_at)
values (
  'mdic-stem-fest-2026',
  'Manarat STEM Fest 2026-27',
  'Manarat Dhaka International School & College, Road 104, Plot 16, Dhaka',
  '2026-10-16 08:00+06',
  '2026-10-17 16:00+06'
);
