-- Institutions catalogue (schools/colleges carry a BANBEIS EIIN, universities a UGC code)
create extension if not exists pg_trgm with schema extensions;

create table public.institutions (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  short_name  text,
  type        text not null check (type in ('school','college','school_and_college','madrasa','technical','university')),
  eiin        text unique,
  ugc_code    text unique,
  ownership   text check (ownership in ('public','private','autonomous','international')),
  district    text,
  created_at  timestamptz not null default now()
);

comment on table public.institutions is 'Educational institutions offered in the sign-up dropdown. Read-only to clients.';
comment on column public.institutions.eiin is 'BANBEIS EIIN, for schools/colleges/madrasas/technical. Null when not yet sourced.';
comment on column public.institutions.ugc_code is 'UGC (or equivalent) identifier for universities. Null when not yet sourced.';

create index institutions_name_trgm on public.institutions using gin (name extensions.gin_trgm_ops);
create index institutions_type_name on public.institutions (type, name);

alter table public.institutions enable row level security;

create policy "institutions are readable by everyone"
  on public.institutions for select
  to anon, authenticated
  using (true);

-- One profile per auth user
create table public.profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  full_name         text,
  institution_id    uuid references public.institutions (id) on delete set null,
  institution_other text,
  dob               date,
  phone             text unique,
  email             text,
  onboarded_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint profiles_phone_bd check (phone is null or phone ~ '^\+8801[3-9][0-9]{8}$'),
  constraint profiles_dob_floor check (dob is null or dob >= date '1900-01-01'),
  constraint profiles_onboarded_complete check (
    onboarded_at is null
    or (full_name is not null and btrim(full_name) <> '' and dob is not null and phone is not null)
  ),
  constraint profiles_one_institution check (
    onboarded_at is null
    or ((institution_id is not null) <> (institution_other is not null and btrim(institution_other) <> ''))
  )
);

comment on table public.profiles is 'Member profile. onboarded_at is null until the sign-up details form is completed.';
comment on column public.profiles.institution_other is 'Free text used when the member picked "Other" instead of a catalogue row.';

alter table public.profiles enable row level security;

create policy "profiles are readable by their owner"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "profiles are insertable by their owner"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

create policy "profiles are updatable by their owner"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Reject a date of birth in the future (CHECK cannot call current_date)
create function public.profiles_validate()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.dob is not null and new.dob > current_date then
    raise exception 'date of birth cannot be in the future';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_validate
  before insert or update on public.profiles
  for each row execute function public.profiles_validate();

-- Every auth user gets a bare profile row immediately
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    nullif(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '')), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
