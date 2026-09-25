alter table public.institutions rename column ugc_code to code;

alter table public.institutions
  add column code_source text check (code_source in ('ugc', 'nu'));

comment on column public.institutions.code is 'Non-EIIN identifier: National University college code, or UGC code for universities. Null when not published.';
comment on column public.institutions.code_source is 'Which registry public.institutions.code came from.';

alter table public.institutions
  add constraint institutions_code_source_pairing check ((code is null) = (code_source is null));
