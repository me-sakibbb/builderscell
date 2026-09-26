-- Campaign registration asks for the same student details every time, so they live on the
-- profile: a returning member never retypes them, and a team lead can pull a team mate's
-- details in by email. is_admin backs the registration review pages.

alter table public.profiles
  add column class_level    smallint,
  add column section        text,
  add column roll           text,
  add column guardian_name  text,
  add column guardian_phone text,
  add column address        text,
  add column is_admin       boolean not null default false;

alter table public.profiles
  add constraint profiles_class_level_range check (class_level is null or class_level between 1 and 12),
  add constraint profiles_guardian_phone_bd check (guardian_phone is null or guardian_phone ~ '^\+8801[3-9][0-9]{8}$'),
  add constraint profiles_section_len check (section is null or char_length(btrim(section)) between 1 and 40),
  add constraint profiles_roll_len check (roll is null or char_length(btrim(roll)) between 1 and 40),
  add constraint profiles_guardian_name_len check (guardian_name is null or char_length(btrim(guardian_name)) between 2 and 80),
  add constraint profiles_address_len check (address is null or char_length(btrim(address)) between 5 and 300);

comment on column public.profiles.class_level is 'Class/grade 1-12. Null until the member fills it in on a registration.';
comment on column public.profiles.section is 'Class section at the institution.';
comment on column public.profiles.roll is 'Roll number or student ID at the institution.';
comment on column public.profiles.address is 'Present address, copied onto registrations as a snapshot.';
comment on column public.profiles.is_admin is 'Grants access to the registration review pages. Server-only: no client role may write it.';

-- A table-level UPDATE grant covers every column, so it has to go before the explicit
-- column grants can mean anything. is_admin is deliberately absent from the list.
revoke update on public.profiles from anon, authenticated;

grant update (
  full_name, institution_id, institution_other, dob, phone, email, onboarded_at,
  class_level, section, roll, guardian_name, guardian_phone, address
) on public.profiles to authenticated;

-- Belt and braces behind the grant: no client role may flip the flag by any route.
create or replace function public.profiles_validate()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.dob is not null and new.dob > current_date then
    raise exception 'date of birth cannot be in the future';
  end if;

  if tg_op = 'UPDATE' and new.is_admin is distinct from old.is_admin
     and current_user in ('anon', 'authenticated') then
    raise exception 'is_admin cannot be changed by this role';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

-- Definer, so policies that call it never recurse back into profiles' own policies.
create function public.is_admin(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = uid), false);
$$;

comment on function public.is_admin is 'True when the given user (default: the caller) may review registrations.';

revoke execute on function public.is_admin(uuid) from anon;

create policy "profiles are readable by admins"
  on public.profiles for select
  to authenticated
  using (public.is_admin());
