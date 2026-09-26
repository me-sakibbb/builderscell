-- Submission and review run in the database, not the app: locking the campaign row makes
-- the seat count, the duplicate-person rule and the transaction-ID check race-proof, and
-- keeps status transitions out of reach of any client policy.

-- Exact-match lookup for pulling a team mate in. No partial search and no listing, so the
-- catalogue of members cannot be walked; an exact address still reveals that member's
-- contact and guardian details to whoever knows it.
create function public.find_member_by_email(p_email text)
returns table (
  user_id           uuid,
  full_name         text,
  email             text,
  phone             text,
  dob               date,
  institution_id    uuid,
  institution_other text,
  institution_name  text,
  class_level       smallint,
  section           text,
  roll              text,
  guardian_name     text,
  guardian_phone    text,
  address           text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.id, p.full_name, p.email, p.phone, p.dob,
    p.institution_id, p.institution_other, i.name,
    p.class_level, p.section, p.roll,
    p.guardian_name, p.guardian_phone, p.address
  from public.profiles p
  left join public.institutions i on i.id = p.institution_id
  where p.onboarded_at is not null
    and p.email is not null
    and lower(btrim(p.email)) = lower(btrim(coalesce(p_email, '')))
  limit 1;
$$;

comment on function public.find_member_by_email is 'One member by exact email, for prefilling a team mate on a registration.';

revoke execute on function public.find_member_by_email(text) from public, anon;
grant execute on function public.find_member_by_email(text) to authenticated;

-- Boolean only: the campaign page shows whether seats remain, never how many.
create function public.campaign_is_full(p_campaign_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when c.capacity is null then false
    else coalesce((
      select sum(r.member_count)
      from public.registrations r
      where r.campaign_id = c.id and r.status in ('pending','approved')
    ), 0) >= c.capacity
  end
  from public.campaigns c
  where c.id = p_campaign_id and c.status <> 'draft';
$$;

comment on function public.campaign_is_full is 'True when pending and approved participants have taken every seat.';

create function public.campaign_stats(p_campaign_id uuid)
returns table (pending integer, approved integer, rejected integer, seats_taken integer, capacity integer)
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
    select
      count(*) filter (where r.status = 'pending')::integer,
      count(*) filter (where r.status = 'approved')::integer,
      count(*) filter (where r.status = 'rejected')::integer,
      coalesce(sum(r.member_count) filter (where r.status in ('pending','approved')), 0)::integer,
      (select c.capacity from public.campaigns c where c.id = p_campaign_id)
    from public.registrations r
    where r.campaign_id = p_campaign_id;
end;
$$;

revoke execute on function public.campaign_stats(uuid) from public, anon;
grant execute on function public.campaign_stats(uuid) to authenticated;

-- Turns the caller's own draft into a pending registration.
-- Payload: { type, payment: {method, transactionId}, heardFrom, heardFromOther,
--            members: [{ linkedUserId, fullName, email, phone, dob, institutionId,
--                        institutionOther, classLevel, section, roll, guardianName,
--                        guardianPhone, address, consentGuardian, consentMedia,
--                        consentSafety }] }
-- A linked member's own profile wins over anything the team lead typed; the lead's own
-- details (participant 1) come from the form.
create function public.submit_registration(p_registration_id uuid, p_payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid           uuid := auth.uid();
  v_reg           public.registrations%rowtype;
  v_campaign      public.campaigns%rowtype;
  v_profile       public.profiles%rowtype;
  v_member        jsonb;
  v_type          text := nullif(btrim(coalesce(p_payload ->> 'type', '')), '');
  v_method        text := nullif(btrim(coalesce(p_payload #>> '{payment,method}', '')), '');
  v_trx           text := nullif(btrim(coalesce(p_payload #>> '{payment,transactionId}', '')), '');
  v_heard         text := nullif(btrim(coalesce(p_payload ->> 'heardFrom', '')), '');
  v_heard_other   text := nullif(btrim(coalesce(p_payload ->> 'heardFromOther', '')), '');
  v_members       jsonb := coalesce(p_payload -> 'members', '[]'::jsonb);
  v_count         integer;
  v_fee           integer;
  v_seats         integer;
  v_position      smallint := 0;
  v_linked        uuid;
  v_owner         uuid;
  v_email         text;
  v_phone         text;
  v_class         smallint;
  v_inst_id       uuid;
  v_inst_other    text;
  v_seen_emails   text[] := '{}';
  v_seen_phones   text[] := '{}';
  v_constraint    text;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  if jsonb_typeof(v_members) <> 'array' then
    raise exception 'invalid_payload';
  end if;
  v_count := jsonb_array_length(v_members);

  select * into v_reg
  from public.registrations
  where id = p_registration_id and user_id = v_uid
  for update;

  if not found then
    raise exception 'registration_not_found';
  end if;
  if v_reg.status <> 'draft' then
    raise exception 'already_submitted';
  end if;

  -- Serialises every submission for this campaign, so seats cannot be oversold.
  select * into v_campaign from public.campaigns where id = v_reg.campaign_id for update;
  if not found then
    raise exception 'campaign_not_found';
  end if;
  if v_campaign.status <> 'open' then
    raise exception 'registration_closed';
  end if;
  if v_campaign.registration_opens_at is not null and now() < v_campaign.registration_opens_at then
    raise exception 'registration_not_open';
  end if;
  if v_campaign.registration_closes_at is not null and now() >= v_campaign.registration_closes_at then
    raise exception 'registration_closed';
  end if;

  if v_type is null or v_type not in ('individual','team')
     or (v_type = 'individual' and not v_campaign.allows_individual)
     or (v_type = 'team' and not v_campaign.allows_team) then
    raise exception 'invalid_type';
  end if;

  if v_type = 'individual' and v_count <> 1 then
    raise exception 'invalid_member_count';
  end if;
  if v_type = 'team' and (v_count < v_campaign.team_min_members or v_count > v_campaign.team_max_members) then
    raise exception 'invalid_member_count';
  end if;

  if v_method is null or v_method not in ('bkash','nagad') then
    raise exception 'invalid_payment_method';
  end if;
  if v_trx is null then
    raise exception 'invalid_transaction_id';
  end if;
  if v_heard is not null and v_heard not in ('friends','open_session','leaflet','social_media','school_notice','other') then
    raise exception 'invalid_heard_from';
  end if;

  if exists (
    select 1 from public.registrations r
    where r.transaction_id is not null and lower(btrim(r.transaction_id)) = lower(v_trx)
  ) then
    raise exception 'transaction_id_taken';
  end if;

  if v_campaign.capacity is not null then
    select coalesce(sum(r.member_count), 0) into v_seats
    from public.registrations r
    where r.campaign_id = v_campaign.id and r.status in ('pending','approved');

    if v_seats + v_count > v_campaign.capacity then
      raise exception 'campaign_full';
    end if;
  end if;

  v_fee := case when v_type = 'individual' then v_campaign.individual_fee_bdt else v_campaign.team_fee_bdt end;

  for v_member in select value from jsonb_array_elements(v_members) loop
    v_position := v_position + 1;
    v_profile := null;

    if v_position = 1 then
      v_owner := v_uid;                       -- participant 1 is always the submitter
      v_linked := null;
    else
      v_linked := nullif(btrim(coalesce(v_member ->> 'linkedUserId', '')), '')::uuid;
      v_owner := v_linked;
    end if;

    if v_linked is not null then
      select * into v_profile from public.profiles where id = v_linked and onboarded_at is not null;
      if not found then
        raise exception 'linked_member_not_found' using detail = v_position::text;
      end if;
    end if;

    v_email := lower(coalesce(nullif(btrim(coalesce(v_profile.email, '')), ''), btrim(coalesce(v_member ->> 'email', ''))));
    v_phone := coalesce(nullif(btrim(coalesce(v_profile.phone, '')), ''), btrim(coalesce(v_member ->> 'phone', '')));
    v_class := coalesce(v_profile.class_level, nullif(btrim(coalesce(v_member ->> 'classLevel', '')), '')::smallint);

    if v_profile.id is not null
       and (v_profile.institution_id is not null or btrim(coalesce(v_profile.institution_other, '')) <> '') then
      v_inst_id := v_profile.institution_id;
      v_inst_other := nullif(btrim(coalesce(v_profile.institution_other, '')), '');
    else
      v_inst_id := nullif(btrim(coalesce(v_member ->> 'institutionId', '')), '')::uuid;
      v_inst_other := nullif(btrim(coalesce(v_member ->> 'institutionOther', '')), '');
    end if;

    if v_class is null then
      raise exception 'invalid_class' using detail = v_position::text;
    end if;
    if v_campaign.min_class_level is not null and v_class < v_campaign.min_class_level then
      raise exception 'class_out_of_range' using detail = v_position::text;
    end if;
    if v_campaign.max_class_level is not null and v_class > v_campaign.max_class_level then
      raise exception 'class_out_of_range' using detail = v_position::text;
    end if;

    if v_email = any (v_seen_emails) or v_phone = any (v_seen_phones) then
      raise exception 'duplicate_member_in_team' using detail = v_position::text;
    end if;
    v_seen_emails := v_seen_emails || v_email;
    v_seen_phones := v_seen_phones || v_phone;

    -- One active registration per person: rejected rows release the person again.
    if exists (
      select 1
      from public.registration_members m
      join public.registrations r on r.id = m.registration_id
      where r.campaign_id = v_campaign.id
        and r.status in ('pending','approved')
        and (
          lower(m.email) = v_email
          or m.phone = v_phone
          or (v_owner is not null and m.user_id = v_owner)
        )
    ) then
      raise exception 'member_already_registered' using detail = v_position::text;
    end if;

    insert into public.registration_members (
      registration_id, position, user_id, full_name, email, phone, dob,
      institution_id, institution_other, class_level, section, roll,
      guardian_name, guardian_phone, address,
      consent_guardian, consent_media, consent_safety
    )
    values (
      v_reg.id,
      v_position,
      v_owner,
      coalesce(nullif(btrim(coalesce(v_profile.full_name, '')), ''), btrim(coalesce(v_member ->> 'fullName', ''))),
      v_email,
      v_phone,
      coalesce(v_profile.dob, nullif(btrim(coalesce(v_member ->> 'dob', '')), '')::date),
      v_inst_id,
      v_inst_other,
      v_class,
      coalesce(nullif(btrim(coalesce(v_profile.section, '')), ''), btrim(coalesce(v_member ->> 'section', ''))),
      coalesce(nullif(btrim(coalesce(v_profile.roll, '')), ''), btrim(coalesce(v_member ->> 'roll', ''))),
      coalesce(nullif(btrim(coalesce(v_profile.guardian_name, '')), ''), btrim(coalesce(v_member ->> 'guardianName', ''))),
      coalesce(nullif(btrim(coalesce(v_profile.guardian_phone, '')), ''), btrim(coalesce(v_member ->> 'guardianPhone', ''))),
      coalesce(nullif(btrim(coalesce(v_profile.address, '')), ''), btrim(coalesce(v_member ->> 'address', ''))),
      coalesce((v_member ->> 'consentGuardian')::boolean, false),
      coalesce((v_member ->> 'consentMedia')::boolean, false),
      coalesce((v_member ->> 'consentSafety')::boolean, false)
    );
  end loop;

  update public.registrations set
    status = 'pending',
    type = v_type,
    member_count = v_count,
    fee_bdt = v_fee,
    payment_method = v_method,
    transaction_id = v_trx,
    heard_from = v_heard,
    heard_from_other = case when v_heard = 'other' then v_heard_other else null end,
    draft = '{}'::jsonb,
    step = 0,
    submitted_at = now()
  where id = v_reg.id;

  -- Fill the blanks on the submitter's own profile so the next form starts pre-filled.
  -- Only empty columns are touched: onboarding still owns name, phone and institution.
  update public.profiles p set
    class_level    = coalesce(p.class_level, m.class_level),
    section        = coalesce(p.section, m.section),
    roll           = coalesce(p.roll, m.roll),
    guardian_name  = coalesce(p.guardian_name, m.guardian_name),
    guardian_phone = coalesce(p.guardian_phone, m.guardian_phone),
    address        = coalesce(p.address, m.address)
  from public.registration_members m
  where p.id = v_uid and m.registration_id = v_reg.id and m.position = 1;

  return v_reg.id;
exception
  when unique_violation then
    get stacked diagnostics v_constraint = constraint_name;
    if v_constraint = 'registrations_transaction_id_unique' then
      raise exception 'transaction_id_taken';
    end if;
    raise;
end;
$$;

comment on function public.submit_registration is 'Validates a draft against its campaign and turns it into a pending registration.';

revoke execute on function public.submit_registration(uuid, jsonb) from public, anon;
grant execute on function public.submit_registration(uuid, jsonb) to authenticated;

-- Admin approve/reject. Pending already holds seats, so only reviving a rejected
-- registration has to re-check capacity.
create function public.review_registration(p_registration_id uuid, p_action text, p_note text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reg      public.registrations%rowtype;
  v_campaign public.campaigns%rowtype;
  v_seats    integer;
begin
  if not public.is_admin() then
    raise exception 'not_authorised';
  end if;
  if p_action not in ('approve','reject') then
    raise exception 'invalid_action';
  end if;

  select * into v_reg from public.registrations where id = p_registration_id for update;
  if not found then
    raise exception 'registration_not_found';
  end if;
  if v_reg.status = 'draft' then
    raise exception 'not_submitted';
  end if;

  if p_action = 'approve' and v_reg.status = 'rejected' then
    select * into v_campaign from public.campaigns where id = v_reg.campaign_id for update;

    if v_campaign.capacity is not null then
      select coalesce(sum(r.member_count), 0) into v_seats
      from public.registrations r
      where r.campaign_id = v_reg.campaign_id and r.status in ('pending','approved');

      if v_seats + v_reg.member_count > v_campaign.capacity then
        raise exception 'campaign_full';
      end if;
    end if;
  end if;

  update public.registrations set
    status      = case when p_action = 'approve' then 'approved' else 'rejected' end,
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    review_note = nullif(btrim(coalesce(p_note, '')), '')
  where id = p_registration_id;

  return p_registration_id;
end;
$$;

comment on function public.review_registration is 'Approve or reject a submitted registration. Admins only.';

revoke execute on function public.review_registration(uuid, text, text) from public, anon;
grant execute on function public.review_registration(uuid, text, text) to authenticated;
