-- Skill mastery / evidence system.
--
-- `exercise_completions` mirrors the existing `progress` table's exact
-- pattern (owner upserts a completed_at timestamp) — there was previously no
-- way to record that a learner actually did an exercise, only that hints/
-- solution notes were shown client-side. This is the missing evidence signal
-- needed to compute a real mastery ladder (NOT_STARTED -> LEARNING ->
-- PRACTICING -> DEMONSTRATED -> STRONG) instead of treating "module marked
-- complete" as "skill mastered."
--
-- Mastery itself is NOT a stored/cached table — it's computed on read by
-- src/lib/mastery.ts from existing signals (module_skills, progress,
-- exercise_completions, portfolio_item_skills), the same
-- "deterministic code computes scores" pattern as skill-gap.ts and the
-- monetisation readiness score. A cached mastery table would just be another
-- thing to keep in sync and go stale; recomputing from source signals never
-- lies.

create table public.exercise_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique (user_id, exercise_id)
);
create index exercise_completions_user_id_idx on public.exercise_completions (user_id);

alter table public.exercise_completions enable row level security;

create policy "exercise_completions_select_own_or_admin" on public.exercise_completions
  for select using (user_id = public.current_user_id() or public.is_admin());
create policy "exercise_completions_insert_own" on public.exercise_completions
  for insert with check (user_id = public.current_user_id());
create policy "exercise_completions_delete_own" on public.exercise_completions
  for delete using (user_id = public.current_user_id());
