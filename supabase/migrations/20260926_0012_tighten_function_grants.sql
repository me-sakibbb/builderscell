-- Functions are granted to PUBLIC by default, which a plain REVOKE ... FROM anon does not
-- undo. Drop the blanket grant and name the roles that may call each one.

revoke execute on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to authenticated;

revoke execute on function public.campaign_is_full(uuid) from public;
grant execute on function public.campaign_is_full(uuid) to anon, authenticated;
