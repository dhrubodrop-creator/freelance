-- Phase 3 of the skill-to-income platform evolution: personalised
-- monetisation intelligence. `monetisation_plans` stores the latest
-- AI-generated plan per user (one active plan, regenerable — same "cached,
-- not recomputed on every page load" pattern as `recommendations`), and
-- `monetisation_actions` holds the checkable weekly tasks tied to it.
--
-- The readiness score is computed by plain deterministic code
-- (src/lib/monetisation.ts), NOT by the LLM — matching this project's
-- existing split between "AI does reasoning/personalisation" and "normal
-- software does arithmetic/permissions/state." The AI only generates the
-- prose summary, suggested paths, and action list.

create table public.monetisation_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  summary text not null,
  suggested_paths jsonb not null default '[]',
  readiness_score integer not null check (readiness_score between 0 and 100),
  generated_at timestamptz not null default now(),
  unique (user_id)
);

create table public.monetisation_actions (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.monetisation_plans (id) on delete cascade,
  week_number integer not null check (week_number between 1 and 4),
  task text not null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);
create index monetisation_actions_plan_id_idx on public.monetisation_actions (plan_id);

alter table public.monetisation_plans enable row level security;
alter table public.monetisation_actions enable row level security;

create policy "monetisation_plans_select_own_or_admin" on public.monetisation_plans
  for select using (user_id = public.current_user_id() or public.is_admin());
create policy "monetisation_plans_insert_own_or_admin" on public.monetisation_plans
  for insert with check (user_id = public.current_user_id() or public.is_admin());
create policy "monetisation_plans_update_own_or_admin" on public.monetisation_plans
  for update using (user_id = public.current_user_id() or public.is_admin());
create policy "monetisation_plans_delete_own_or_admin" on public.monetisation_plans
  for delete using (user_id = public.current_user_id() or public.is_admin());

-- monetisation_actions has no user_id of its own — ownership is via the parent plan.
create policy "monetisation_actions_select_own_or_admin" on public.monetisation_actions
  for select using (
    exists (select 1 from public.monetisation_plans p where p.id = plan_id and (p.user_id = public.current_user_id() or public.is_admin()))
  );
create policy "monetisation_actions_insert_own_or_admin" on public.monetisation_actions
  for insert with check (
    exists (select 1 from public.monetisation_plans p where p.id = plan_id and (p.user_id = public.current_user_id() or public.is_admin()))
  );
create policy "monetisation_actions_update_own_or_admin" on public.monetisation_actions
  for update using (
    exists (select 1 from public.monetisation_plans p where p.id = plan_id and (p.user_id = public.current_user_id() or public.is_admin()))
  );
create policy "monetisation_actions_delete_own_or_admin" on public.monetisation_actions
  for delete using (
    exists (select 1 from public.monetisation_plans p where p.id = plan_id and (p.user_id = public.current_user_id() or public.is_admin()))
  );
