-- One SELECT policy per role per table: Postgres evaluates every permissive policy on
-- every row, so owner-or-admin reads belong in a single expression. anon keeps its own
-- policy because it may not execute is_admin().

drop policy "profiles are readable by their owner" on public.profiles;
drop policy "profiles are readable by admins" on public.profiles;

create policy "profiles are readable by their owner or an admin"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id or public.is_admin());

drop policy "registrations are readable by their owner" on public.registrations;
drop policy "registrations are readable by admins" on public.registrations;

create policy "registrations are readable by their owner or an admin"
  on public.registrations for select
  to authenticated
  using ((select auth.uid()) = user_id or public.is_admin());

drop policy "participants are readable by the registration owner" on public.registration_members;
drop policy "participants are readable by admins" on public.registration_members;

create policy "participants are readable by the registration owner or an admin"
  on public.registration_members for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.registrations r
      where r.id = registration_id and r.user_id = (select auth.uid())
    )
  );

drop policy "published campaigns are readable by everyone" on public.campaigns;
drop policy "campaigns are readable by admins" on public.campaigns;
drop policy "campaigns are writable by admins" on public.campaigns;

create policy "published campaigns are readable by visitors"
  on public.campaigns for select
  to anon
  using (status <> 'draft');

create policy "campaigns are readable by members, drafts by admins"
  on public.campaigns for select
  to authenticated
  using (status <> 'draft' or public.is_admin());

create policy "campaigns are insertable by admins"
  on public.campaigns for insert
  to authenticated
  with check (public.is_admin());

create policy "campaigns are updatable by admins"
  on public.campaigns for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "campaigns are deletable by admins"
  on public.campaigns for delete
  to authenticated
  using (public.is_admin());
