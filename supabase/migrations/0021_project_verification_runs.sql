-- Phases 7-10: a single, consolidated evidence table for every automated
-- verification check (code review, architecture drift, generated tests,
-- visual QA, accessibility, security, performance, AI evaluation, failure
-- replay). The brief's section 49 lists these as separate candidate tables
-- but also explicitly warns against blindly creating all of them — each
-- check type's result is genuinely structured but shares the exact same
-- shape (what was checked, what was found, a score, blockers), so one
-- discriminated table (same pattern this codebase already uses for
-- `analytics_events`) avoids nine near-identical tables while keeping every
-- check queryable and evidence-linkable. `results` holds the check-specific
-- structured payload (findings/violations/metrics/eval cases).
create table public.project_verification_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  portfolio_item_id uuid references public.portfolio_items (id) on delete cascade,
  check_type text not null check (
    check_type in (
      'code_review', 'architecture_drift', 'test_generation', 'visual_qa',
      'accessibility', 'security', 'performance', 'ai_evaluation', 'failure_replay'
    )
  ),
  input_summary text not null,
  results jsonb not null default '{}',
  score integer,
  blockers text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index project_verification_runs_user_id_idx on public.project_verification_runs (user_id, created_at desc);
create index project_verification_runs_item_idx on public.project_verification_runs (portfolio_item_id, check_type);

alter table public.project_verification_runs enable row level security;

create policy "project_verification_runs_select_own_or_admin" on public.project_verification_runs
  for select using (user_id = public.current_user_id() or public.is_admin());
create policy "project_verification_runs_insert_own" on public.project_verification_runs
  for insert with check (user_id = public.current_user_id());

-- Architecture Guardian's baseline, for projects that didn't come from an
-- approved Build-From-My-Idea plan (which already carries
-- architecture_proposal). Nullable, learner-settable, never auto-populated
-- with an invented architecture.
alter table public.portfolio_items add column architecture_note text;
