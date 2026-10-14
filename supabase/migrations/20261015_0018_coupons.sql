-- Coupons: a code a member types on the payment step to change what they pay. A coupon
-- takes a percentage off, a fixed amount off, or sets a fixed final price, for the
-- campaigns it is attached to (or every campaign). It is live only while switched on and
-- inside its optional window, and an optional cap counts pending and approved
-- registrations, so a rejected registration frees its use again.
--
-- The price is decided here, never in the app: preview_coupon() quotes it on the payment
-- step and submit_registration() re-quotes it under a row lock, then snapshots the code,
-- the listed fee and the discount onto the registration. Editing a coupon later never
-- rewrites what an earlier registration paid.

create table public.coupons (
  id                     uuid primary key default gen_random_uuid(),
  code                   text not null,
  label                  text,
  discount_type          text not null check (discount_type in ('percent','amount_off','fixed_price')),
  percent_off            smallint,
  max_discount_bdt       integer,
  individual_value_bdt   integer,
  team_value_bdt         integer,
  applies_to_individual  boolean not null default true,
  applies_to_team        boolean not null default true,
  all_campaigns          boolean not null default false,
  is_active              boolean not null default false,
  starts_at              timestamptz,
  ends_at                timestamptz,
  max_redemptions        integer,
  created_by             uuid references auth.users (id) on delete set null,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  -- Stored upper-case, so a plain unique index makes codes case-insensitive.
  constraint coupons_code_format check (code ~ '^[A-Z0-9][A-Z0-9_-]{2,31}$'),
  constraint coupons_label_length check (label is null or char_length(btrim(label)) between 1 and 120),
  constraint coupons_mode check (applies_to_individual or applies_to_team),
  constraint coupons_percent check (
    discount_type <> 'percent'
    or (percent_off between 1 and 100 and individual_value_bdt is null and team_value_bdt is null)
  ),
  constraint coupons_values check (
    discount_type = 'percent'
    or (
      percent_off is null and max_discount_bdt is null
      and (not applies_to_individual or individual_value_bdt is not null)
      and (not applies_to_team or team_value_bdt is not null)
    )
  ),
  constraint coupons_values_range check (
    (individual_value_bdt is null or individual_value_bdt >= 0)
    and (team_value_bdt is null or team_value_bdt >= 0)
    and (max_discount_bdt is null or max_discount_bdt > 0)
  ),
  constraint coupons_amount_off_positive check (
    discount_type <> 'amount_off'
    or (coalesce(individual_value_bdt, 1) > 0 and coalesce(team_value_bdt, 1) > 0)
  ),
  constraint coupons_window check (starts_at is null or ends_at is null or ends_at > starts_at),
  constraint coupons_cap check (max_redemptions is null or max_redemptions > 0)
);

comment on table public.coupons is 'Discount codes for campaign fees. Admin-only; members reach them only through preview_coupon().';
comment on column public.coupons.percent_off is 'For percent coupons: share of the fee taken off, 1 to 100.';
comment on column public.coupons.max_discount_bdt is 'For percent coupons: optional ceiling on the discount.';
comment on column public.coupons.individual_value_bdt is 'For amount_off: BDT taken off. For fixed_price: the price paid. Individual registrations.';
comment on column public.coupons.team_value_bdt is 'As individual_value_bdt, for team registrations (the whole team fee).';
comment on column public.coupons.is_active is 'Master switch. Off overrides the schedule.';
comment on column public.coupons.max_redemptions is 'Cap on pending plus approved registrations using this coupon. Null means uncapped.';

create unique index coupons_code_key on public.coupons (code);
create index coupons_created_at on public.coupons (created_at desc);
create index coupons_created_by on public.coupons (created_by);

create trigger coupons_touch_updated_at
  before update on public.coupons
  for each row execute function public.touch_updated_at();

create table public.coupon_campaigns (
  coupon_id   uuid not null references public.coupons (id) on delete cascade,
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  primary key (coupon_id, campaign_id)
);

comment on table public.coupon_campaigns is 'Campaigns a coupon applies to. Ignored when the coupon is marked all_campaigns.';

create index coupon_campaigns_campaign on public.coupon_campaigns (campaign_id);

-- Snapshot of the coupon on each registration.
alter table public.registrations
  add column coupon_id        uuid references public.coupons (id) on delete restrict,
  add column coupon_code      text,
  add column original_fee_bdt integer,
  add column discount_bdt     integer,
  add constraint registrations_coupon_pairing check (
    ((coupon_id is null) = (coupon_code is null)) and ((coupon_id is null) = (discount_bdt is null))
  ),
  add constraint registrations_discount_range check (
    discount_bdt is null or (discount_bdt >= 0 and original_fee_bdt is not null and discount_bdt <= original_fee_bdt)
  );

comment on column public.registrations.coupon_id is 'Coupon applied at submission. A used coupon cannot be deleted, only switched off.';
comment on column public.registrations.coupon_code is 'The code as it read at submission time.';
comment on column public.registrations.original_fee_bdt is 'Listed fee before any coupon. fee_bdt is what the member was asked to pay.';
comment on column public.registrations.discount_bdt is 'BDT taken off by the coupon.';

create index registrations_coupon on public.registrations (coupon_id, status);

update public.registrations set original_fee_bdt = fee_bdt where status <> 'draft' and original_fee_bdt is null;

-- Admins read, switch and delete coupons directly; creating and editing go through
-- admin_save_coupon() so the campaign links change in the same transaction.
alter table public.coupons enable row level security;
alter table public.coupon_campaigns enable row level security;

revoke all on public.coupons from anon;
revoke all on public.coupon_campaigns from anon;
revoke insert on public.coupons from authenticated;
revoke insert, update, delete on public.coupon_campaigns from authenticated;

create policy "coupons are readable by admins"
  on public.coupons for select
  to authenticated
  using (public.is_admin());

create policy "coupons are updatable by admins"
  on public.coupons for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "coupons are deletable by admins"
  on public.coupons for delete
  to authenticated
  using (public.is_admin());

create policy "coupon campaigns are readable by admins"
  on public.coupon_campaigns for select
  to authenticated
  using (public.is_admin());

-- The discount a coupon gives on a fee. Never more than the fee itself.
create function public.coupon_discount(p_coupon public.coupons, p_type text, p_base integer)
returns integer
language sql
immutable
set search_path = ''
as $$
  select greatest(0, least(p_base, case p_coupon.discount_type
    when 'percent' then least(
      round(p_base * p_coupon.percent_off / 100.0)::integer,
      coalesce(p_coupon.max_discount_bdt, p_base)
    )
    when 'amount_off' then
      case when p_type = 'individual' then p_coupon.individual_value_bdt else p_coupon.team_value_bdt end
    when 'fixed_price' then
      p_base - case when p_type = 'individual' then p_coupon.individual_value_bdt else p_coupon.team_value_bdt end
  end));
$$;

comment on function public.coupon_discount is 'BDT a coupon takes off a fee. A fixed price above the fee gives no discount.';

revoke execute on function public.coupon_discount(public.coupons, text, integer) from public, anon, authenticated;

-- Every rule a coupon has to pass, in one place. Raises a bare code on failure.
-- p_lock takes the coupon row for update, so two submissions cannot both take its last use.
create function public.quote_coupon(
  p_campaign_id uuid,
  p_type        text,
  p_code        text,
  p_base        integer,
  p_lock        boolean default false
)
returns table (coupon_id uuid, code text, discount integer)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_code   text := upper(btrim(coalesce(p_code, '')));
  v_coupon public.coupons%rowtype;
  v_used   integer;
begin
  if p_lock then
    select * into v_coupon from public.coupons c where c.code = v_code for update;
  else
    select * into v_coupon from public.coupons c where c.code = v_code;
  end if;

  if not found or not v_coupon.is_active then
    raise exception 'coupon_not_found';
  end if;
  if v_coupon.starts_at is not null and now() < v_coupon.starts_at then
    raise exception 'coupon_not_started';
  end if;
  if v_coupon.ends_at is not null and now() >= v_coupon.ends_at then
    raise exception 'coupon_expired';
  end if;
  if not v_coupon.all_campaigns and not exists (
    select 1 from public.coupon_campaigns cc
    where cc.coupon_id = v_coupon.id and cc.campaign_id = p_campaign_id
  ) then
    raise exception 'coupon_not_for_campaign';
  end if;
  if (p_type = 'individual' and not v_coupon.applies_to_individual)
     or (p_type = 'team' and not v_coupon.applies_to_team) then
    raise exception 'coupon_not_for_type';
  end if;

  if v_coupon.max_redemptions is not null then
    select count(*) into v_used
    from public.registrations r
    where r.coupon_id = v_coupon.id and r.status in ('pending','approved');

    if v_used >= v_coupon.max_redemptions then
      raise exception 'coupon_used_up';
    end if;
  end if;

  return query select v_coupon.id, v_coupon.code, public.coupon_discount(v_coupon, p_type, p_base);
end;
$$;

comment on function public.quote_coupon is 'Validates a code against a campaign and registration type and returns the discount. Internal.';

revoke execute on function public.quote_coupon(uuid, text, text, integer, boolean) from public, anon, authenticated;

-- What the payment step calls: the price this member would pay with this code.
create function public.preview_coupon(p_campaign_id uuid, p_type text, p_code text)
returns table (code text, original_fee integer, discount integer, final_fee integer)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_campaign public.campaigns%rowtype;
  v_base     integer;
  v_quote    record;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_campaign from public.campaigns c where c.id = p_campaign_id and c.status = 'open';
  if not found then
    raise exception 'registration_closed';
  end if;

  if p_type is null or p_type not in ('individual','team')
     or (p_type = 'individual' and not v_campaign.allows_individual)
     or (p_type = 'team' and not v_campaign.allows_team) then
    raise exception 'invalid_type';
  end if;

  v_base := case when p_type = 'individual' then v_campaign.individual_fee_bdt else v_campaign.team_fee_bdt end;

  select * into v_quote from public.quote_coupon(v_campaign.id, p_type, p_code, v_base, false);

  return query select v_quote.code, v_base, v_quote.discount, v_base - v_quote.discount;
end;
$$;

comment on function public.preview_coupon is 'Quotes a coupon for the caller''s registration type. Exact code only; coupons cannot be listed.';

revoke execute on function public.preview_coupon(uuid, text, text) from public, anon;
grant execute on function public.preview_coupon(uuid, text, text) to authenticated;

-- Create (p_id null) or edit a coupon, and replace its campaign links, in one go.
-- Payload: { code, label, discountType, percentOff, maxDiscount, individualValue, teamValue,
--            appliesToIndividual, appliesToTeam, allCampaigns, campaignIds, isActive,
--            startsAt, endsAt, maxRedemptions }
create function public.admin_save_coupon(p_id uuid, p_payload jsonb)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_id         uuid;
  v_all        boolean := coalesce((p_payload ->> 'allCampaigns')::boolean, false);
  v_campaigns  uuid[];
  v_constraint text;
begin
  if not public.is_admin() then
    raise exception 'not_authorised';
  end if;

  v_campaigns := coalesce(
    array(select distinct value::uuid from jsonb_array_elements_text(coalesce(p_payload -> 'campaignIds', '[]'::jsonb))),
    '{}'
  );
  if not v_all and cardinality(v_campaigns) = 0 then
    raise exception 'coupon_needs_campaign';
  end if;

  if p_id is null then
    insert into public.coupons (
      code, label, discount_type, percent_off, max_discount_bdt, individual_value_bdt, team_value_bdt,
      applies_to_individual, applies_to_team, all_campaigns, is_active, starts_at, ends_at,
      max_redemptions, created_by
    )
    values (
      upper(btrim(coalesce(p_payload ->> 'code', ''))),
      nullif(btrim(coalesce(p_payload ->> 'label', '')), ''),
      p_payload ->> 'discountType',
      (p_payload ->> 'percentOff')::smallint,
      (p_payload ->> 'maxDiscount')::integer,
      (p_payload ->> 'individualValue')::integer,
      (p_payload ->> 'teamValue')::integer,
      coalesce((p_payload ->> 'appliesToIndividual')::boolean, false),
      coalesce((p_payload ->> 'appliesToTeam')::boolean, false),
      v_all,
      coalesce((p_payload ->> 'isActive')::boolean, false),
      (p_payload ->> 'startsAt')::timestamptz,
      (p_payload ->> 'endsAt')::timestamptz,
      (p_payload ->> 'maxRedemptions')::integer,
      auth.uid()
    )
    returning id into v_id;
  else
    update public.coupons set
      code                  = upper(btrim(coalesce(p_payload ->> 'code', ''))),
      label                 = nullif(btrim(coalesce(p_payload ->> 'label', '')), ''),
      discount_type         = p_payload ->> 'discountType',
      percent_off           = (p_payload ->> 'percentOff')::smallint,
      max_discount_bdt      = (p_payload ->> 'maxDiscount')::integer,
      individual_value_bdt  = (p_payload ->> 'individualValue')::integer,
      team_value_bdt        = (p_payload ->> 'teamValue')::integer,
      applies_to_individual = coalesce((p_payload ->> 'appliesToIndividual')::boolean, false),
      applies_to_team       = coalesce((p_payload ->> 'appliesToTeam')::boolean, false),
      all_campaigns         = v_all,
      is_active             = coalesce((p_payload ->> 'isActive')::boolean, false),
      starts_at             = (p_payload ->> 'startsAt')::timestamptz,
      ends_at               = (p_payload ->> 'endsAt')::timestamptz,
      max_redemptions       = (p_payload ->> 'maxRedemptions')::integer
    where id = p_id
    returning id into v_id;

    if v_id is null then
      raise exception 'coupon_not_found';
    end if;
  end if;

  delete from public.coupon_campaigns where coupon_id = v_id;
  if not v_all then
    insert into public.coupon_campaigns (coupon_id, campaign_id)
    select v_id, c.id from public.campaigns c where c.id = any (v_campaigns);
  end if;

  return v_id;
exception
  when unique_violation then
    get stacked diagnostics v_constraint = constraint_name;
    if v_constraint = 'coupons_code_key' then
      raise exception 'coupon_code_taken';
    end if;
    raise;
  when check_violation then
    raise exception 'invalid_coupon';
end;
$$;

comment on function public.admin_save_coupon is 'Creates or updates a coupon and its campaign links. Admins only.';

revoke execute on function public.admin_save_coupon(uuid, jsonb) from public, anon;
grant execute on function public.admin_save_coupon(uuid, jsonb) to authenticated;

-- Coupon list with usage counted in Postgres, newest first, one page at a time.
create function public.admin_list_coupons(
  p_q      text default '',
  p_limit  integer default 20,
  p_offset integer default 0
)
returns table (
  id                    uuid,
  code                  text,
  label                 text,
  discount_type         text,
  percent_off           smallint,
  max_discount_bdt      integer,
  individual_value_bdt  integer,
  team_value_bdt        integer,
  applies_to_individual boolean,
  applies_to_team       boolean,
  all_campaigns         boolean,
  is_active             boolean,
  starts_at             timestamptz,
  ends_at               timestamptz,
  max_redemptions       integer,
  pending_uses          integer,
  approved_uses         integer,
  campaign_titles       text[],
  total_count           bigint
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
      k.id, k.code, k.label, k.discount_type, k.percent_off, k.max_discount_bdt,
      k.individual_value_bdt, k.team_value_bdt, k.applies_to_individual, k.applies_to_team,
      k.all_campaigns, k.is_active, k.starts_at, k.ends_at, k.max_redemptions,
      coalesce(u.pending, 0),
      coalesce(u.approved, 0),
      coalesce((
        select array_agg(c.title order by c.title)
        from public.coupon_campaigns cc
        join public.campaigns c on c.id = cc.campaign_id
        where cc.coupon_id = k.id
      ), '{}'::text[]),
      count(*) over ()
    from public.coupons k
    left join lateral (
      select
        count(*) filter (where r.status = 'pending')::integer as pending,
        count(*) filter (where r.status = 'approved')::integer as approved
      from public.registrations r
      where r.coupon_id = k.id
    ) u on true
    where v_q is null or k.code ilike '%' || v_q || '%' or k.label ilike '%' || v_q || '%'
    order by k.created_at desc
    limit least(greatest(coalesce(p_limit, 20), 1), 100)
    offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

comment on function public.admin_list_coupons is 'Paginated, searchable coupon list with pending and approved use counts. Admins only.';

revoke execute on function public.admin_list_coupons(text, integer, integer) from public, anon;
grant execute on function public.admin_list_coupons(text, integer, integer) to authenticated;

-- Review queue gains a coupon filter and the coupon columns. The return type changes,
-- so the function is dropped and recreated.
drop function public.admin_list_registrations(uuid, text, text, integer, integer);

create function public.admin_list_registrations(
  p_campaign uuid default null,
  p_status   text default null,
  p_q        text default '',
  p_limit    integer default 20,
  p_offset   integer default 0,
  p_coupon   text default null
)
returns table (
  id               uuid,
  campaign_id      uuid,
  campaign_title   text,
  campaign_slug    text,
  status           text,
  type             text,
  member_count     smallint,
  fee_bdt          integer,
  original_fee_bdt integer,
  discount_bdt     integer,
  coupon_code      text,
  payment_method   text,
  transaction_id   text,
  submitted_at     timestamptz,
  reviewed_at      timestamptz,
  review_note      text,
  lead_name        text,
  lead_email       text,
  member_names     text[],
  total_count      bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_q      text := nullif(btrim(coalesce(p_q, '')), '');
  v_coupon text := nullif(upper(btrim(coalesce(p_coupon, ''))), '');
begin
  if not public.is_admin() then
    raise exception 'not_authorised';
  end if;

  return query
    with filtered as (
      select r.*, c.title as campaign_title, c.slug as campaign_slug
      from public.registrations r
      join public.campaigns c on c.id = r.campaign_id
      where r.status <> 'draft'
        and (p_campaign is null or r.campaign_id = p_campaign)
        and (p_status is null or r.status = p_status)
        -- Matches the coupon as it is named now, so a renamed code still finds its uses.
        and (
          v_coupon is null
          or exists (select 1 from public.coupons k where k.id = r.coupon_id and k.code = v_coupon)
        )
        and (
          v_q is null
          or r.transaction_id ilike '%' || v_q || '%'
          or exists (
            select 1
            from public.registration_members m
            where m.registration_id = r.id
              and (
                m.full_name ilike '%' || v_q || '%'
                or m.email ilike '%' || v_q || '%'
                or m.phone ilike '%' || v_q || '%'
              )
          )
        )
    )
    select
      f.id, f.campaign_id, f.campaign_title, f.campaign_slug, f.status, f.type,
      f.member_count, f.fee_bdt, f.original_fee_bdt, f.discount_bdt, f.coupon_code,
      f.payment_method, f.transaction_id, f.submitted_at,
      f.reviewed_at, f.review_note,
      lead.full_name, lead.email,
      coalesce((
        select array_agg(m.full_name order by m.position)
        from public.registration_members m
        where m.registration_id = f.id
      ), '{}'::text[]),
      count(*) over ()
    from filtered f
    left join public.registration_members lead
      on lead.registration_id = f.id and lead.position = 1
    order by f.submitted_at desc nulls last, f.created_at desc
    limit least(greatest(coalesce(p_limit, 20), 1), 100)
    offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

comment on function public.admin_list_registrations is 'Paginated, searchable review queue, filterable by coupon. Admins only.';

revoke execute on function public.admin_list_registrations(uuid, text, text, integer, integer, text) from public, anon;
grant execute on function public.admin_list_registrations(uuid, text, text, integer, integer, text) to authenticated;

-- Submission now takes an optional `couponCode` in the payload. Everything else is
-- unchanged from 0010.
create or replace function public.submit_registration(p_registration_id uuid, p_payload jsonb)
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
  v_coupon_input  text := nullif(upper(btrim(coalesce(p_payload ->> 'couponCode', ''))), '');
  v_members       jsonb := coalesce(p_payload -> 'members', '[]'::jsonb);
  v_count         integer;
  v_fee           integer;
  v_original_fee  integer;
  v_coupon_id     uuid;
  v_coupon_code   text;
  v_discount      integer;
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

  v_original_fee := case when v_type = 'individual' then v_campaign.individual_fee_bdt else v_campaign.team_fee_bdt end;
  v_fee := v_original_fee;

  -- Locks the coupon row, so its last use cannot be taken twice across campaigns.
  if v_coupon_input is not null then
    select q.coupon_id, q.code, q.discount into v_coupon_id, v_coupon_code, v_discount
    from public.quote_coupon(v_campaign.id, v_type, v_coupon_input, v_original_fee, true) q;
    v_fee := v_original_fee - v_discount;
  end if;

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
    original_fee_bdt = v_original_fee,
    discount_bdt = v_discount,
    coupon_id = v_coupon_id,
    coupon_code = v_coupon_code,
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

-- Reviving a rejected registration takes its coupon use back, so the cap is re-checked
-- the same way seats are. Switching the coupon off or its window closing does not block
-- this: the member already paid the discounted price.
create or replace function public.review_registration(p_registration_id uuid, p_action text, p_note text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reg      public.registrations%rowtype;
  v_campaign public.campaigns%rowtype;
  v_coupon   public.coupons%rowtype;
  v_seats    integer;
  v_used     integer;
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

    if v_reg.coupon_id is not null then
      select * into v_coupon from public.coupons where id = v_reg.coupon_id for update;

      if v_coupon.max_redemptions is not null then
        select count(*) into v_used
        from public.registrations r
        where r.coupon_id = v_coupon.id and r.status in ('pending','approved');

        if v_used >= v_coupon.max_redemptions then
          raise exception 'coupon_used_up';
        end if;
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
