-- Entry diagnostic + personalised navigation guidance.
--
-- One row per (user, course), regenerable — same "cached, not recomputed
-- every page load" pattern as `recommendations` / `monetisation_plans`.
-- Scoring is plain deterministic code (src/lib/diagnostic.ts), not an LLM
-- call: it's a set comparison against `module_skills` (self-rated skill
-- level per module the course already teaches), the same
-- "AI reasons, normal code computes scores" split used by
-- src/lib/skill-gap.ts and src/lib/monetisation.ts's readiness score.
--
-- Personalisation is guidance, not restriction: `module_guidance` only ever
-- softens/highlights navigation (e.g. "you can likely skim this"), it never
-- gates access — `progress`/`enrollments` RLS is still the only access
-- control. A module only gets a non-'full' depth when real signal exists
-- (its `module_skills` row + the user's self-rating for that skill); with no
-- signal, it stays 'full' rather than guessing.

create table public.course_diagnostics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  experience_level text not null check (experience_level in ('new', 'some_exposure', 'practiced', 'professional')),
  confidence_rating integer not null check (confidence_rating between 1 and 5),
  -- {skill_id: 'unfamiliar' | 'aware' | 'practiced' | 'confident'} for the
  -- skills this course's modules actually teach (module_skills), not a
  -- free-text field.
  skill_ratings jsonb not null default '{}',
  -- {module_id: {"depth": "review" | "full" | "foundation_plus_practice" | "advanced_challenge", "reason": "..."}}
  module_guidance jsonb not null default '{}',
  starting_point text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, course_id)
);
create index course_diagnostics_user_id_idx on public.course_diagnostics (user_id);

alter table public.course_diagnostics enable row level security;

create policy "course_diagnostics_select_own_or_admin" on public.course_diagnostics
  for select using (user_id = public.current_user_id() or public.is_admin());
create policy "course_diagnostics_insert_own_or_admin" on public.course_diagnostics
  for insert with check (user_id = public.current_user_id() or public.is_admin());
create policy "course_diagnostics_update_own_or_admin" on public.course_diagnostics
  for update using (user_id = public.current_user_id() or public.is_admin());
create policy "course_diagnostics_delete_own_or_admin" on public.course_diagnostics
  for delete using (user_id = public.current_user_id() or public.is_admin());
