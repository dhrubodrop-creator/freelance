-- Phase 1 of the skill-to-income platform evolution: the onboarding form
-- captured a one-time snapshot (occupation/industry/career_goal/hours_per_week)
-- but the product needs an ongoing professional profile — the foundation
-- everything else (skills, portfolio, monetisation matching) builds on.
--
-- Extends the existing `profiles` table rather than replacing it; adds two
-- new repeatable-record tables (work_experiences, education) following the
-- same owner-or-admin RLS pattern as every other user-owned table in this
-- schema. Photo is deliberately NOT added here — Clerk already owns avatar
-- data via its own UI, and duplicating that would just create two
-- out-of-sync sources of truth for the same thing.

alter table public.profiles
  add column if not exists location text,
  add column if not exists bio text,
  add column if not exists preferred_language text,
  add column if not exists income_goal_inr integer,
  add column if not exists work_preference text
    check (work_preference in ('full_time', 'contract', 'freelance', 'consulting', 'remote_only')),
  add column if not exists linkedin_url text,
  add column if not exists portfolio_url text,
  add column if not exists github_url text,
  add column if not exists website_url text;

create table public.work_experiences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  company text not null,
  role text not null,
  start_date date,
  end_date date,
  description text,
  achievements text[] not null default '{}',
  skills_used text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index work_experiences_user_id_idx on public.work_experiences (user_id);

create table public.education (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  institution text not null,
  degree text,
  field text,
  start_date date,
  end_date date,
  created_at timestamptz not null default now()
);
create index education_user_id_idx on public.education (user_id);

alter table public.work_experiences enable row level security;
alter table public.education enable row level security;

create policy "work_experiences_select_own_or_admin" on public.work_experiences
  for select using (user_id = public.current_user_id() or public.is_admin());
create policy "work_experiences_insert_own_or_admin" on public.work_experiences
  for insert with check (user_id = public.current_user_id() or public.is_admin());
create policy "work_experiences_update_own_or_admin" on public.work_experiences
  for update using (user_id = public.current_user_id() or public.is_admin());
create policy "work_experiences_delete_own_or_admin" on public.work_experiences
  for delete using (user_id = public.current_user_id() or public.is_admin());

create policy "education_select_own_or_admin" on public.education
  for select using (user_id = public.current_user_id() or public.is_admin());
create policy "education_insert_own_or_admin" on public.education
  for insert with check (user_id = public.current_user_id() or public.is_admin());
create policy "education_update_own_or_admin" on public.education
  for update using (user_id = public.current_user_id() or public.is_admin());
create policy "education_delete_own_or_admin" on public.education
  for delete using (user_id = public.current_user_id() or public.is_admin());
