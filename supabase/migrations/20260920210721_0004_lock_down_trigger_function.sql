-- handle_new_user is a trigger function; nothing should be able to call it over the API.
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.profiles_validate() from public, anon, authenticated;
