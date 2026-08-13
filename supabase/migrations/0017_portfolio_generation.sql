-- Portfolio generation: turns real project data (portfolio item + logged
-- decisions + linked skills) into a case study, short version, resume
-- bullets, and an interview story — AI-drafted, never auto-published. The
-- `approved` flag is the explicit "user must review and approve" gate from
-- the spec; nothing reads this table as ground truth about the learner
-- until they've flipped it.
--
-- One row per portfolio item (regenerable via upsert, same pattern as
-- monetisation_plans/course_diagnostics), join-through-parent RLS same as
-- project_decisions.

create table public.portfolio_case_studies (
  id uuid primary key default gen_random_uuid(),
  portfolio_item_id uuid not null references public.portfolio_items (id) on delete cascade,
  case_study text not null,
  short_version text not null,
  resume_bullets text[] not null default '{}',
  interview_story text not null,
  approved boolean not null default false,
  generated_at timestamptz not null default now(),
  unique (portfolio_item_id)
);

alter table public.portfolio_case_studies enable row level security;

create policy "portfolio_case_studies_select_own_or_admin" on public.portfolio_case_studies
  for select using (
    exists (select 1 from public.portfolio_items p where p.id = portfolio_item_id and (p.user_id = public.current_user_id() or public.is_admin()))
  );
create policy "portfolio_case_studies_insert_own_or_admin" on public.portfolio_case_studies
  for insert with check (
    exists (select 1 from public.portfolio_items p where p.id = portfolio_item_id and (p.user_id = public.current_user_id() or public.is_admin()))
  );
create policy "portfolio_case_studies_update_own_or_admin" on public.portfolio_case_studies
  for update using (
    exists (select 1 from public.portfolio_items p where p.id = portfolio_item_id and (p.user_id = public.current_user_id() or public.is_admin()))
  );
create policy "portfolio_case_studies_delete_own_or_admin" on public.portfolio_case_studies
  for delete using (
    exists (select 1 from public.portfolio_items p where p.id = portfolio_item_id and (p.user_id = public.current_user_id() or public.is_admin()))
  );
