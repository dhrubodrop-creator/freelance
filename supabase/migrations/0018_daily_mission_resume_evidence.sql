-- Automated engineering studio, Phase 2/3 foundation: Daily Mission, exact
-- resume state, Instant Concept Rescue, and Automatic Catch-Up Plan.
--
-- All four tables hang off existing entities (users/courses/modules/
-- exercises) rather than introducing a parallel "project" or "session"
-- concept — same reasoning as project_decisions/portfolio_case_studies in
-- earlier migrations. Selection logic for all four lives in plain
-- deterministic code (src/lib/daily-mission.ts, resume-state.ts,
-- catchup-plan.ts) reading real progress/enrollment/exercise-completion
-- signals; only the learner-facing prose (why-it-matters framing, the
-- concept rescue explanation itself) goes through the existing AI router,
-- matching this project's established "AI reasons/explains, code computes"
-- split (see skill-gap.ts, monetisation.ts).

-- One real, actionable priority per learner per day. Regenerable (upsert),
-- same "cached, not recomputed every page load" pattern as
-- recommendations/monetisation_plans/course_diagnostics.
create table public.daily_missions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  mission_date date not null,
  course_id uuid not null references public.courses (id) on delete cascade,
  module_id uuid references public.modules (id) on delete set null,
  exercise_id uuid references public.exercises (id) on delete set null,
  objective text not null,
  why_it_matters text not null,
  estimated_minutes integer not null,
  acceptance_criteria text[] not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'skipped')),
  -- Which real signal selected this mission (next_incomplete_module,
  -- unfinished_exercise, skill_gap_practice, catchup) — not free text, so
  -- the UI's "why" can be honest instead of inventing a reason.
  reason text not null check (
    reason in ('next_incomplete_module', 'unfinished_exercise', 'skill_gap_practice', 'catchup', 'capstone_progress')
  ),
  generated_via text not null default 'deterministic' check (generated_via in ('deterministic', 'ai')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, mission_date)
);
create index daily_missions_user_id_idx on public.daily_missions (user_id, mission_date desc);

-- Exact resume state per (learner, course) — module/tab/exercise/video
-- position. One row per course a learner is enrolled in, not a growing
-- history table; "Continue Learning" reads this instead of guessing from
-- `progress` alone (progress only tracks completion, not where they stopped
-- mid-module).
create table public.learner_checkpoints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  module_id uuid references public.modules (id) on delete set null,
  active_tab text check (active_tab in ('overview', 'playbook', 'practice', 'interview')),
  exercise_id uuid references public.exercises (id) on delete set null,
  video_position_seconds integer,
  updated_at timestamptz not null default now(),
  unique (user_id, course_id)
);
create index learner_checkpoints_user_id_idx on public.learner_checkpoints (user_id);

-- "I don't understand" — Instant Concept Rescue. Evidence/audit log of
-- rescue requests, same append-only shape as mentor_messages; the response
-- is stored structurally (5 parts) rather than as opaque chat text so the UI
-- can render it consistently.
create table public.concept_rescue_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  module_id uuid not null references public.modules (id) on delete cascade,
  exercise_id uuid references public.exercises (id) on delete set null,
  question text,
  simple_explanation text not null,
  visual_example text not null,
  analogy text not null,
  code_example text,
  five_minute_practice text not null,
  created_at timestamptz not null default now()
);
create index concept_rescue_requests_user_id_idx on public.concept_rescue_requests (user_id, created_at desc);

-- Automatic Catch-Up Plan for an inactive learner. Regenerable per
-- (user, course), deterministic math only (pace/effort), never an
-- AI-invented schedule — see src/lib/catchup-plan.ts.
create table public.catchup_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  days_inactive integer not null,
  remaining_modules integer not null,
  recommended_weekly_minutes integer not null,
  weekly_plan jsonb not null default '[]',
  target_completion_date date,
  generated_at timestamptz not null default now(),
  unique (user_id, course_id)
);
create index catchup_plans_user_id_idx on public.catchup_plans (user_id);

alter table public.daily_missions enable row level security;
alter table public.learner_checkpoints enable row level security;
alter table public.concept_rescue_requests enable row level security;
alter table public.catchup_plans enable row level security;

create policy "daily_missions_select_own_or_admin" on public.daily_missions
  for select using (user_id = public.current_user_id() or public.is_admin());
create policy "daily_missions_insert_own_or_admin" on public.daily_missions
  for insert with check (user_id = public.current_user_id() or public.is_admin());
create policy "daily_missions_update_own_or_admin" on public.daily_missions
  for update using (user_id = public.current_user_id() or public.is_admin());

create policy "learner_checkpoints_select_own_or_admin" on public.learner_checkpoints
  for select using (user_id = public.current_user_id() or public.is_admin());
create policy "learner_checkpoints_insert_own" on public.learner_checkpoints
  for insert with check (user_id = public.current_user_id());
create policy "learner_checkpoints_update_own" on public.learner_checkpoints
  for update using (user_id = public.current_user_id());

create policy "concept_rescue_requests_select_own_or_admin" on public.concept_rescue_requests
  for select using (user_id = public.current_user_id() or public.is_admin());
create policy "concept_rescue_requests_insert_own" on public.concept_rescue_requests
  for insert with check (user_id = public.current_user_id());

create policy "catchup_plans_select_own_or_admin" on public.catchup_plans
  for select using (user_id = public.current_user_id() or public.is_admin());
create policy "catchup_plans_insert_own_or_admin" on public.catchup_plans
  for insert with check (user_id = public.current_user_id() or public.is_admin());
create policy "catchup_plans_update_own_or_admin" on public.catchup_plans
  for update using (user_id = public.current_user_id() or public.is_admin());
