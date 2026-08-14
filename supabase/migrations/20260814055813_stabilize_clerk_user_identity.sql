-- Backfill the application-profile shell for identities created before
-- request-time provisioning existed. Existing profile data is never changed.
insert into public.profiles (user_id)
select u.id
from public.users u
left join public.profiles p on p.user_id = u.id
where p.id is null
on conflict (user_id) do nothing;

-- Application identity is server-managed. Browser sessions may read their own
-- row through RLS, but cannot rewrite clerk_id or elevate role.
revoke all privileges on table public.users from anon;
revoke insert, update, delete, truncate, references, trigger on table public.users from authenticated;
grant select on table public.users to authenticated;

drop policy if exists "users_insert_admin" on public.users;
drop policy if exists "users_update_own_or_admin" on public.users;
drop policy if exists "users_select_own_or_admin" on public.users;
create policy "users_select_own_or_admin" on public.users
  for select to authenticated
  using (clerk_id = public.current_clerk_id() or public.is_admin());

-- Profiles remain self-service, with ownership checked both before and after
-- every update so a row cannot be reassigned to another user.
revoke all privileges on table public.profiles from anon;
revoke delete, truncate, references, trigger on table public.profiles from authenticated;
grant select, insert, update on table public.profiles to authenticated;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
drop policy if exists "profiles_insert_own_or_admin" on public.profiles;
drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select to authenticated
  using (user_id = public.current_user_id() or public.is_admin());
create policy "profiles_insert_own_or_admin" on public.profiles
  for insert to authenticated
  with check (user_id = public.current_user_id() or public.is_admin());
create policy "profiles_update_own_or_admin" on public.profiles
  for update to authenticated
  using (user_id = public.current_user_id() or public.is_admin())
  with check (user_id = public.current_user_id() or public.is_admin());
