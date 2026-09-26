-- Review queue: filtering, searching and paging all happen in Postgres, and the total
-- travels with the page so the UI never counts rows itself. Drafts are never listed.

create function public.admin_list_registrations(
  p_campaign uuid default null,
  p_status   text default null,
  p_q        text default '',
  p_limit    integer default 20,
  p_offset   integer default 0
)
returns table (
  id             uuid,
  campaign_id    uuid,
  campaign_title text,
  campaign_slug  text,
  status         text,
  type           text,
  member_count   smallint,
  fee_bdt        integer,
  payment_method text,
  transaction_id text,
  submitted_at   timestamptz,
  reviewed_at    timestamptz,
  review_note    text,
  lead_name      text,
  lead_email     text,
  member_names   text[],
  total_count    bigint
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
    with filtered as (
      select r.*, c.title as campaign_title, c.slug as campaign_slug
      from public.registrations r
      join public.campaigns c on c.id = r.campaign_id
      where r.status <> 'draft'
        and (p_campaign is null or r.campaign_id = p_campaign)
        and (p_status is null or r.status = p_status)
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
      f.member_count, f.fee_bdt, f.payment_method, f.transaction_id, f.submitted_at,
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

comment on function public.admin_list_registrations is 'Paginated, searchable review queue. Admins only.';

revoke execute on function public.admin_list_registrations(uuid, text, text, integer, integer) from public, anon;
grant execute on function public.admin_list_registrations(uuid, text, text, integer, integer) to authenticated;
