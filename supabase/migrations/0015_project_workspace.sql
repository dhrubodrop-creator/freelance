-- Project decision log + capstone/defence architecture.
--
-- `project_decisions` hangs off the existing `portfolio_items` table (same
-- join-through-parent ownership pattern as `portfolio_item_skills` /
-- `monetisation_actions`) rather than building a parallel "project" concept
-- — a portfolio item already IS the project record; this just adds
-- structured decision entries to it (section 22: decision / alternatives /
-- reasoning / tradeoff), which becomes real interview-defence material
-- instead of a vague "I used RAG" bullet point.
--
-- Capstone/defence is genuinely new surface (nothing existing models "a
-- course has one official capstone brief" or "an AI interviewed this
-- learner about their submission"), so it gets its own tables:
--   course_capstones     — one admin-authored brief per course (enrollment-gated,
--                          same access pattern as `modules`/`playbooks`)
--   capstone_submissions — links a learner's portfolio item to that brief
--   capstone_reviews     — the AI defence Q&A + multi-dimension scoring,
--                          one row per submission (regenerable via upsert,
--                          same "cached, not recomputed" pattern as
--                          monetisation_plans/course_diagnostics)
--
-- The defence itself is a two-step structured exchange (AI generates
-- adaptive follow-up questions from the actual submission -> learner
-- answers -> AI scores using both the project and the answers), not a
-- live chat transcript — deliberately simpler than building new streaming
-- chat infra when the existing AI mentor already covers open-ended chat
-- (see src/lib/mentor.ts), and it still satisfies "questions should adapt
-- to the submitted project" without inventing a second chat system.

create table public.project_decisions (
  id uuid primary key default gen_random_uuid(),
  portfolio_item_id uuid not null references public.portfolio_items (id) on delete cascade,
  decision text not null,
  alternatives text,
  reasoning text not null,
  tradeoff text,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);
create index project_decisions_portfolio_item_id_idx on public.project_decisions (portfolio_item_id);

create table public.course_capstones (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  title text not null,
  brief text not null,
  requirements text[] not null default '{}',
  scoring_dimensions text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (course_id)
);

create table public.capstone_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  capstone_id uuid not null references public.course_capstones (id) on delete cascade,
  portfolio_item_id uuid not null references public.portfolio_items (id) on delete cascade,
  status text not null default 'in_progress' check (
    status in ('in_progress', 'awaiting_defence_answers', 'submitted_for_review', 'reviewed')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, capstone_id)
);
create index capstone_submissions_user_id_idx on public.capstone_submissions (user_id);

create table public.capstone_reviews (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.capstone_submissions (id) on delete cascade,
  defence_questions jsonb not null default '[]',
  defence_answers jsonb not null default '[]',
  dimension_scores jsonb not null default '{}',
  overall_feedback text,
  strengths text[] not null default '{}',
  weaknesses text[] not null default '{}',
  missing text[] not null default '{}',
  improvements text[] not null default '{}',
  generated_at timestamptz not null default now(),
  unique (submission_id)
);

alter table public.project_decisions enable row level security;
alter table public.course_capstones enable row level security;
alter table public.capstone_submissions enable row level security;
alter table public.capstone_reviews enable row level security;

-- project_decisions: ownership via parent portfolio_items row.
create policy "project_decisions_select_own_or_admin" on public.project_decisions
  for select using (
    exists (select 1 from public.portfolio_items p where p.id = portfolio_item_id and (p.user_id = public.current_user_id() or public.is_admin()))
  );
create policy "project_decisions_insert_own_or_admin" on public.project_decisions
  for insert with check (
    exists (select 1 from public.portfolio_items p where p.id = portfolio_item_id and (p.user_id = public.current_user_id() or public.is_admin()))
  );
create policy "project_decisions_update_own_or_admin" on public.project_decisions
  for update using (
    exists (select 1 from public.portfolio_items p where p.id = portfolio_item_id and (p.user_id = public.current_user_id() or public.is_admin()))
  );
create policy "project_decisions_delete_own_or_admin" on public.project_decisions
  for delete using (
    exists (select 1 from public.portfolio_items p where p.id = portfolio_item_id and (p.user_id = public.current_user_id() or public.is_admin()))
  );

-- course_capstones: same enrollment-gated pattern as modules/playbooks (paid content).
create policy "course_capstones_select_enrolled_or_admin" on public.course_capstones
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.enrollments e
      where e.course_id = course_capstones.course_id and e.user_id = public.current_user_id() and e.status = 'active'
    )
  );
create policy "course_capstones_write_admin" on public.course_capstones
  for all using (public.is_admin()) with check (public.is_admin());

create policy "capstone_submissions_select_own_or_admin" on public.capstone_submissions
  for select using (user_id = public.current_user_id() or public.is_admin());
create policy "capstone_submissions_insert_own_or_admin" on public.capstone_submissions
  for insert with check (user_id = public.current_user_id() or public.is_admin());
create policy "capstone_submissions_update_own_or_admin" on public.capstone_submissions
  for update using (user_id = public.current_user_id() or public.is_admin());
create policy "capstone_submissions_delete_own_or_admin" on public.capstone_submissions
  for delete using (user_id = public.current_user_id() or public.is_admin());

-- capstone_reviews: ownership via parent submission.
create policy "capstone_reviews_select_own_or_admin" on public.capstone_reviews
  for select using (
    exists (select 1 from public.capstone_submissions s where s.id = submission_id and (s.user_id = public.current_user_id() or public.is_admin()))
  );
create policy "capstone_reviews_insert_own_or_admin" on public.capstone_reviews
  for insert with check (
    exists (select 1 from public.capstone_submissions s where s.id = submission_id and (s.user_id = public.current_user_id() or public.is_admin()))
  );
create policy "capstone_reviews_update_own_or_admin" on public.capstone_reviews
  for update using (
    exists (select 1 from public.capstone_submissions s where s.id = submission_id and (s.user_id = public.current_user_id() or public.is_admin()))
  );
