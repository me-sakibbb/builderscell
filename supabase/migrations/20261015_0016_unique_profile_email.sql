-- One account per email address. auth.users already enforces this (users_email_partial_key);
-- this mirrors it on profiles, case-insensitively, so a profile can never share an address.
create unique index if not exists profiles_email_lower_key on public.profiles (lower(email));
