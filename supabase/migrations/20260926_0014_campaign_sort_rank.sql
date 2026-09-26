-- Open campaigns first, then closed, then archived. Stored so the listing can page on it.
alter table public.campaigns
  add column status_rank smallint generated always as (
    case status when 'open' then 0 when 'closed' then 1 when 'archived' then 2 else 3 end
  ) stored;

comment on column public.campaigns.status_rank is 'Sort key for the campaigns listing. Derived from status.';

create index campaigns_listing_order on public.campaigns (status_rank, starts_on desc nulls last, created_at desc);
