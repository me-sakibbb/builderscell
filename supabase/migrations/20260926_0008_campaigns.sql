-- A campaign is anything members register for: the robotics bootcamp today, workshops and
-- competitions later. Copy lives in these columns so a new campaign needs no deploy; the
-- registration form itself stays bespoke per campaign.

create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create table public.campaigns (
  id                      uuid primary key default gen_random_uuid(),
  slug                    text not null unique,
  title                   text not null,
  kind                    text not null default 'bootcamp' check (kind in ('bootcamp','workshop','competition','session','other')),
  status                  text not null default 'draft' check (status in ('draft','open','closed','archived')),
  eyebrow                 text,
  summary                 text not null,
  description             text,
  highlights              jsonb not null default '[]'::jsonb,
  fee_lines               jsonb not null default '[]'::jsonb,
  payment_instructions    text,
  payment_numbers         jsonb not null default '[]'::jsonb,
  allows_individual       boolean not null default true,
  allows_team             boolean not null default false,
  individual_fee_bdt      integer,
  team_fee_bdt            integer,
  team_min_members        smallint not null default 2,
  team_max_members        smallint not null default 3,
  min_class_level         smallint,
  max_class_level         smallint,
  capacity                integer,
  location                text,
  starts_on               date,
  ends_on                 date,
  registration_opens_at   timestamptz,
  registration_closes_at  timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  constraint campaigns_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint campaigns_mode check (allows_individual or allows_team),
  constraint campaigns_individual_fee check (not allows_individual or individual_fee_bdt is not null),
  constraint campaigns_team_fee check (not allows_team or team_fee_bdt is not null),
  constraint campaigns_fee_positive check (
    (individual_fee_bdt is null or individual_fee_bdt >= 0) and (team_fee_bdt is null or team_fee_bdt >= 0)
  ),
  constraint campaigns_team_size check (team_min_members between 2 and 10 and team_max_members between team_min_members and 10),
  constraint campaigns_class_range check (
    (min_class_level is null or min_class_level between 1 and 12)
    and (max_class_level is null or max_class_level between 1 and 12)
    and (min_class_level is null or max_class_level is null or max_class_level >= min_class_level)
  ),
  constraint campaigns_capacity_positive check (capacity is null or capacity > 0),
  constraint campaigns_dates check (starts_on is null or ends_on is null or ends_on >= starts_on),
  constraint campaigns_registration_window check (
    registration_opens_at is null or registration_closes_at is null or registration_closes_at > registration_opens_at
  ),
  constraint campaigns_highlights_array check (jsonb_typeof(highlights) = 'array'),
  constraint campaigns_fee_lines_array check (jsonb_typeof(fee_lines) = 'array'),
  constraint campaigns_payment_numbers_array check (jsonb_typeof(payment_numbers) = 'array')
);

comment on table public.campaigns is 'Programmes members can register for. Draft rows are admin-only; everything else is public.';
comment on column public.campaigns.capacity is 'Seat limit counted per participant. Pending and approved registrations both hold seats. Null means uncapped.';
comment on column public.campaigns.highlights is 'Array of {title, body} shown on the campaign page.';
comment on column public.campaigns.fee_lines is 'Array of {label, amount, note} rendered in the fee panel.';
comment on column public.campaigns.payment_numbers is 'Array of {method, number} the fee is sent to.';

create index campaigns_status_starts_on on public.campaigns (status, starts_on desc nulls last, created_at desc);

create trigger campaigns_touch_updated_at
  before update on public.campaigns
  for each row execute function public.touch_updated_at();

alter table public.campaigns enable row level security;

create policy "published campaigns are readable by everyone"
  on public.campaigns for select
  to anon, authenticated
  using (status <> 'draft');

create policy "campaigns are readable by admins"
  on public.campaigns for select
  to authenticated
  using (public.is_admin());

create policy "campaigns are writable by admins"
  on public.campaigns for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
