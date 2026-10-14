-- Displayed coupons: an admin can advertise a coupon on the campaign pages, where the
-- listed fee is shown crossed out next to the coupon price, with a message saying who
-- it is for. The code itself is only shown when the admin opts in per coupon.
--
-- campaign_offers() is the only public way in: it returns the best live displayed offer
-- per open campaign and registration type, and never returns a code that is hidden.

alter table public.coupons
  add column display_enabled   boolean not null default false,
  add column display_message   text,
  add column display_show_code boolean not null default false,
  add constraint coupons_display_message check (
    (display_message is null or char_length(btrim(display_message)) between 2 and 140)
    and (not display_enabled or display_message is not null)
  );

comment on column public.coupons.display_enabled is 'Advertise this coupon on the campaign pages while it is live.';
comment on column public.coupons.display_message is 'Who the offer is for, shown next to the crossed-out price.';
comment on column public.coupons.display_show_code is 'Show the code itself with the offer. Off keeps the code private.';

-- Same rules quote_coupon() enforces, as a yes/no for listing.
create function public.coupon_is_live(p_coupon public.coupons)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_coupon.is_active
    and (p_coupon.starts_at is null or now() >= p_coupon.starts_at)
    and (p_coupon.ends_at is null or now() < p_coupon.ends_at)
    and (
      p_coupon.max_redemptions is null
      or (
        select count(*) from public.registrations r
        where r.coupon_id = p_coupon.id and r.status in ('pending','approved')
      ) < p_coupon.max_redemptions
    );
$$;

comment on function public.coupon_is_live is 'True while a coupon is switched on, inside its window and under its cap. Internal.';

revoke execute on function public.coupon_is_live(public.coupons) from public, anon, authenticated;

-- Best displayed offer per campaign and registration type: the largest discount wins,
-- the older coupon breaks a tie. Offers that take nothing off are left out.
create function public.campaign_offers(p_campaign_ids uuid[])
returns table (
  campaign_id  uuid,
  type         text,
  code         text,
  message      text,
  original_fee integer,
  discount     integer,
  final_fee    integer
)
language sql
stable
security definer
set search_path = ''
as $$
  with fees as (
    select c.id as campaign_id, t.type, t.fee
    from public.campaigns c
    cross join lateral (
      values
        ('individual'::text, case when c.allows_individual then c.individual_fee_bdt end),
        ('team'::text, case when c.allows_team then c.team_fee_bdt end)
    ) as t(type, fee)
    where c.id = any (coalesce(p_campaign_ids, '{}'))
      and c.status = 'open'
      and t.fee is not null
  ),
  candidates as (
    select
      f.campaign_id, f.type, f.fee, k.created_at,
      case when k.display_show_code then k.code end as code,
      k.display_message as message,
      public.coupon_discount(k, f.type, f.fee) as discount
    from fees f
    join public.coupons k
      on k.display_enabled
      and (
        (f.type = 'individual' and k.applies_to_individual)
        or (f.type = 'team' and k.applies_to_team)
      )
      and (
        k.all_campaigns
        or exists (
          select 1 from public.coupon_campaigns cc
          where cc.coupon_id = k.id and cc.campaign_id = f.campaign_id
        )
      )
    where public.coupon_is_live(k)
  )
  select distinct on (x.campaign_id, x.type)
    x.campaign_id, x.type, x.code, x.message, x.fee, x.discount, x.fee - x.discount
  from candidates x
  where x.discount > 0
  order by x.campaign_id, x.type, x.discount desc, x.created_at asc;
$$;

comment on function public.campaign_offers is 'Best live displayed coupon per open campaign and registration type. Hidden codes come back null.';

revoke execute on function public.campaign_offers(uuid[]) from public;
grant execute on function public.campaign_offers(uuid[]) to anon, authenticated;

-- Save now carries the display settings: displayEnabled, displayMessage, displayShowCode.
create or replace function public.admin_save_coupon(p_id uuid, p_payload jsonb)
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
      max_redemptions, display_enabled, display_message, display_show_code, created_by
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
      coalesce((p_payload ->> 'displayEnabled')::boolean, false),
      nullif(btrim(coalesce(p_payload ->> 'displayMessage', '')), ''),
      coalesce((p_payload ->> 'displayShowCode')::boolean, false),
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
      max_redemptions       = (p_payload ->> 'maxRedemptions')::integer,
      display_enabled       = coalesce((p_payload ->> 'displayEnabled')::boolean, false),
      display_message       = nullif(btrim(coalesce(p_payload ->> 'displayMessage', '')), ''),
      display_show_code     = coalesce((p_payload ->> 'displayShowCode')::boolean, false)
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

-- The list gains the display flag. The return type changes, so drop and recreate.
drop function public.admin_list_coupons(text, integer, integer);

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
  display_enabled       boolean,
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
      k.all_campaigns, k.is_active, k.starts_at, k.ends_at, k.max_redemptions, k.display_enabled,
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
