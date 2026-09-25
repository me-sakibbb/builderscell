-- Server-side pagination for the picker: the dropdown asks for one page at a time.
drop function if exists public.search_institutions(text, integer);

create function public.search_institutions(q text default '', lim integer default 20, off integer default 0)
returns setof public.institutions
language sql
stable
set search_path = ''
as $$
  select i.*
  from public.institutions i
  where
    coalesce(btrim(q), '') = ''
    or i.name ilike '%' || btrim(q) || '%'
    or i.short_name ilike btrim(q) || '%'
    or i.eiin = btrim(q)
    or i.code = btrim(q)
  order by
    case
      when coalesce(btrim(q), '') = '' then 3
      when lower(i.short_name) = lower(btrim(q)) then 0
      when i.eiin = btrim(q) or i.code = btrim(q) then 0
      when i.name ilike btrim(q) || '%' then 1
      when i.short_name ilike btrim(q) || '%' then 2
      else 3
    end,
    case i.type
      when 'university' then 0
      when 'college' then 1
      when 'school_and_college' then 2
      when 'school' then 3
      when 'madrasa' then 4
      else 5
    end,
    i.name,
    i.id
  limit least(greatest(coalesce(lim, 20), 1), 50)
  offset greatest(coalesce(off, 0), 0);
$$;

comment on function public.search_institutions is 'Ranked, paginated institution search backing the sign-up dropdown.';
