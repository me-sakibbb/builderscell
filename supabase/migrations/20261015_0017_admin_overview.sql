-- Admin overview: headline counts across every campaign, and a paged per-campaign
-- breakdown. Both are counted in Postgres so the UI never tallies rows itself.
-- Drafts are never counted.

create function public.admin_overview_stats()
returns table (pending integer, approved integer, rejected integer, total integer)
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
      count(*)::integer
    from public.registrations r
    where r.status <> 'draft';
end;
$$;

comment on function public.admin_overview_stats is 'Registration counts by status across all campaigns. Admins only.';

revoke execute on function public.admin_overview_stats() from public, anon;
grant execute on function public.admin_overview_stats() to authenticated;

-- Seats follow campaign_stats: pending and approved registrations both hold seats,
-- counted per participant.
create function public.admin_campaign_overview(
  p_limit  integer default 10,
  p_offset integer default 0
)
returns table (
  id          uuid,
  slug        text,
  title       text,
  status      text,
  pending     integer,
  approved    integer,
  rejected    integer,
  seats_taken integer,
  capacity    integer,
  total_count bigint
)
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
      c.id, c.slug, c.title, c.status,
      coalesce(s.pending, 0),
      coalesce(s.approved, 0),
      coalesce(s.rejected, 0),
      coalesce(s.seats_taken, 0),
      c.capacity,
      count(*) over ()
    from public.campaigns c
    left join lateral (
      select
        count(*) filter (where r.status = 'pending')::integer as pending,
        count(*) filter (where r.status = 'approved')::integer as approved,
        count(*) filter (where r.status = 'rejected')::integer as rejected,
        coalesce(sum(r.member_count) filter (where r.status in ('pending','approved')), 0)::integer as seats_taken
      from public.registrations r
      where r.campaign_id = c.id
    ) s on true
    order by c.status_rank asc, c.starts_on desc nulls last, c.created_at desc
    limit least(greatest(coalesce(p_limit, 10), 1), 100)
    offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

comment on function public.admin_campaign_overview is 'Paginated per-campaign registration counts. Admins only.';

revoke execute on function public.admin_campaign_overview(integer, integer) from public, anon;
grant execute on function public.admin_campaign_overview(integer, integer) to authenticated;
