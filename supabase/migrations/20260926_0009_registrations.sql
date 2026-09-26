-- A registration is one payment: either a single student or a team of two or three. The
-- wizard saves progress into `draft` as the member fills it in; participant rows are only
-- written when it is submitted, which is why every member column below is not null.

create table public.registrations (
  id              uuid primary key default gen_random_uuid(),
  campaign_id     uuid not null references public.campaigns (id) on delete restrict,
  user_id         uuid not null references auth.users (id) on delete cascade,
  status          text not null default 'draft' check (status in ('draft','pending','approved','rejected')),
  type            text check (type in ('individual','team')),
  member_count    smallint,
  fee_bdt         integer,
  payment_method  text check (payment_method in ('bkash','nagad')),
  transaction_id  text,
  heard_from      text check (heard_from in ('friends','open_session','leaflet','social_media','school_notice','other')),
  heard_from_other text,
  draft           jsonb not null default '{}'::jsonb,
  step            smallint not null default 0,
  submitted_at    timestamptz,
  reviewed_by     uuid references auth.users (id) on delete set null,
  reviewed_at     timestamptz,
  review_note     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint registrations_draft_object check (jsonb_typeof(draft) = 'object'),
  constraint registrations_step_range check (step between 0 and 12),
  constraint registrations_member_count_matches_type check (
    type is null
    or (type = 'individual' and member_count = 1)
    or (type = 'team' and member_count between 2 and 10)
  ),
  constraint registrations_submitted_complete check (
    status = 'draft'
    or (
      type is not null and member_count is not null and fee_bdt is not null
      and payment_method is not null and btrim(coalesce(transaction_id, '')) <> ''
      and submitted_at is not null
    )
  ),
  constraint registrations_reviewed_pairing check ((status in ('approved','rejected')) = (reviewed_at is not null)),
  constraint registrations_heard_from_other check (
    heard_from is distinct from 'other' or btrim(coalesce(heard_from_other, '')) <> ''
  ),
  constraint registrations_fee_positive check (fee_bdt is null or fee_bdt >= 0)
);

comment on table public.registrations is 'One submitted payment per row. Drafts hold wizard state in `draft` and have no participant rows yet.';
comment on column public.registrations.user_id is 'The member who filled the form in. Participant 1 is this member.';
comment on column public.registrations.draft is 'Wizard state while status = draft. Ignored once submitted.';
comment on column public.registrations.fee_bdt is 'Fee the server expected at submission time, copied off the campaign.';

create index registrations_campaign_status on public.registrations (campaign_id, status, submitted_at desc nulls last);
create index registrations_user on public.registrations (user_id, created_at desc);
create index registrations_reviewed_by on public.registrations (reviewed_by);
create unique index registrations_one_draft_per_campaign on public.registrations (user_id, campaign_id) where status = 'draft';
create unique index registrations_transaction_id_unique on public.registrations (lower(btrim(transaction_id))) where transaction_id is not null;

create trigger registrations_touch_updated_at
  before update on public.registrations
  for each row execute function public.touch_updated_at();

-- Participants. Details are a snapshot: editing a profile later never rewrites a
-- submitted registration.
create table public.registration_members (
  id                uuid primary key default gen_random_uuid(),
  registration_id   uuid not null references public.registrations (id) on delete cascade,
  position          smallint not null check (position between 1 and 10),
  user_id           uuid references auth.users (id) on delete set null,
  full_name         text not null,
  email             text not null,
  phone             text not null,
  dob               date not null,
  institution_id    uuid references public.institutions (id) on delete set null,
  institution_other text,
  class_level       smallint not null check (class_level between 1 and 12),
  section           text not null,
  roll              text not null,
  guardian_name     text not null,
  guardian_phone    text not null,
  address           text not null,
  consent_guardian  boolean not null,
  consent_media     boolean not null,
  consent_safety    boolean not null,
  created_at        timestamptz not null default now(),
  constraint registration_members_phone_bd check (phone ~ '^\+8801[3-9][0-9]{8}$'),
  constraint registration_members_guardian_phone_bd check (guardian_phone ~ '^\+8801[3-9][0-9]{8}$'),
  constraint registration_members_email_format check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  constraint registration_members_dob_past check (dob >= date '1900-01-01'),
  constraint registration_members_one_institution check (
    (institution_id is not null) <> (btrim(coalesce(institution_other, '')) <> '')
  ),
  -- The form lets a guardian answer No; we do not accept a registration on those terms.
  constraint registration_members_consents check (consent_guardian and consent_media and consent_safety),
  constraint registration_members_text_lengths check (
    char_length(btrim(full_name)) between 2 and 80
    and char_length(btrim(section)) between 1 and 40
    and char_length(btrim(roll)) between 1 and 40
    and char_length(btrim(guardian_name)) between 2 and 80
    and char_length(btrim(address)) between 5 and 300
  ),
  unique (registration_id, position)
);

comment on table public.registration_members is 'Participants on a submitted registration. Written only by submit_registration().';
comment on column public.registration_members.user_id is 'Set when the participant is an existing Builder''sCell member.';

create index registration_members_registration on public.registration_members (registration_id, position);
create index registration_members_user on public.registration_members (user_id);
create index registration_members_email on public.registration_members (lower(email));
create index registration_members_phone on public.registration_members (phone);
create index registration_members_institution on public.registration_members (institution_id);

alter table public.registrations enable row level security;
alter table public.registration_members enable row level security;

-- Clients may create and edit their own draft, and read whatever they submitted.
-- Submission and review both run through security-definer functions, so no policy
-- hands a client a route to set its own status.
create policy "registrations are readable by their owner"
  on public.registrations for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "registrations are readable by admins"
  on public.registrations for select
  to authenticated
  using (public.is_admin());

create policy "drafts are insertable by their owner"
  on public.registrations for insert
  to authenticated
  with check ((select auth.uid()) = user_id and status = 'draft');

create policy "drafts are updatable by their owner"
  on public.registrations for update
  to authenticated
  using ((select auth.uid()) = user_id and status = 'draft')
  with check ((select auth.uid()) = user_id and status = 'draft');

create policy "drafts are deletable by their owner"
  on public.registrations for delete
  to authenticated
  using ((select auth.uid()) = user_id and status = 'draft');

create policy "participants are readable by the registration owner"
  on public.registration_members for select
  to authenticated
  using (
    exists (
      select 1 from public.registrations r
      where r.id = registration_id and r.user_id = (select auth.uid())
    )
  );

create policy "participants are readable by admins"
  on public.registration_members for select
  to authenticated
  using (public.is_admin());

-- Only the wizard's own columns are writable; status, fees and review fields are not.
revoke insert, update on public.registrations from anon, authenticated;
grant insert (campaign_id, user_id, draft, step) on public.registrations to authenticated;
grant update (draft, step) on public.registrations to authenticated;

revoke insert, update, delete on public.registration_members from anon, authenticated;
