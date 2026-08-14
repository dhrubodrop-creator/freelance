-- Phase 11: Client / Discovery Call / Scope Creep / Incident / Demo Day
-- simulators. Technical Defense (section 30) already exists via
-- course_capstones/capstone_submissions/capstone_reviews from an earlier
-- migration — not duplicated here.
--
-- One consolidated table for all five simulator types (same reasoning as
-- project_verification_runs): each is a scenario + turn-based transcript +
-- eventual evaluation, differing only in system-prompt/scoring dimensions,
-- not in shape. `scenario_context` stores what the AI was told to roleplay
-- (so it can be inspected/audited, and so the AI stays grounded turn to
-- turn instead of drifting). Text-only — the brief explicitly allows a text
-- fallback when voice infra isn't available, and no voice/telephony
-- provider is configured in this deployment.
create table public.simulation_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  portfolio_item_id uuid references public.portfolio_items (id) on delete set null,
  simulation_type text not null check (
    simulation_type in ('client', 'discovery_call', 'scope_creep', 'incident', 'demo_day')
  ),
  scenario_context jsonb not null default '{}',
  transcript jsonb not null default '[]',
  status text not null default 'active' check (status in ('active', 'completed')),
  evaluation jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index simulation_sessions_user_id_idx on public.simulation_sessions (user_id, created_at desc);

alter table public.simulation_sessions enable row level security;

create policy "simulation_sessions_select_own_or_admin" on public.simulation_sessions
  for select using (user_id = public.current_user_id() or public.is_admin());
create policy "simulation_sessions_insert_own" on public.simulation_sessions
  for insert with check (user_id = public.current_user_id());
create policy "simulation_sessions_update_own" on public.simulation_sessions
  for update using (user_id = public.current_user_id());
