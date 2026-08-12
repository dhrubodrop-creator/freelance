-- Learning-content depth pass (starting with Data Science, Module 1 only).
-- Reuses the existing course/module architecture rather than building a
-- separate CMS — these are additive tables hung off `modules`, following
-- the same RLS pattern as everything else gated by enrollment (`modules`
-- itself): public sees nothing, enrolled students see the parent module's
-- content, admins see everything.
--
-- module_playbook_sections holds the actual "professional field manual"
-- content (mental models, decision frameworks, workflow, failure modes,
-- debugging guides, checklists, templates, curated resources) as one
-- flexible, searchable table rather than a dozen narrow ones — a
-- `section_type` enum keeps it structured, and a generated tsvector column
-- makes it searchable the same way `content_chunks` already is.
create table public.module_playbook_sections (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules (id) on delete cascade,
  section_type text not null check (section_type in (
    'the_field', 'mental_models', 'decision_framework', 'workflow',
    'failure_modes', 'debugging_playbook', 'checklist', 'template', 'resources'
  )),
  title text not null,
  content text not null,
  order_index integer not null default 0,
  search_vector tsvector generated always as (to_tsvector('english', title || ' ' || content)) stored,
  version integer not null default 1,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index module_playbook_sections_module_id_idx on public.module_playbook_sections (module_id);
create index module_playbook_sections_search_idx on public.module_playbook_sections using gin (search_vector);

-- Tiered practice exercises (guided -> semi-guided -> independent -> capstone),
-- per the spec's ambiguity-ladder model. Solution/hints are separate columns
-- so the UI can reveal them progressively instead of all at once.
create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules (id) on delete cascade,
  level text not null check (level in ('guided', 'semi_guided', 'independent', 'capstone')),
  title text not null,
  problem_statement text not null,
  starter_context text,
  hints text[] not null default '{}',
  solution_notes text,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);
create index exercises_module_id_idx on public.exercises (module_id);

-- Interview question bank per module, per the spec's required fields
-- (what's actually being tested, not just the question).
create table public.interview_questions (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules (id) on delete cascade,
  category text not null check (category in (
    'fundamentals', 'applied', 'scenario', 'debugging', 'system_design', 'project_defence', 'behavioural'
  )),
  question text not null,
  what_is_tested text not null,
  strong_answer_structure text not null,
  weak_answer_example text,
  follow_up_question text,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);
create index interview_questions_module_id_idx on public.interview_questions (module_id);

-- Skills a module actually teaches, reusing the existing skills taxonomy
-- from Phase 2 rather than inventing a parallel one.
create table public.module_skills (
  module_id uuid not null references public.modules (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete cascade,
  primary key (module_id, skill_id)
);

alter table public.module_playbook_sections enable row level security;
alter table public.exercises enable row level security;
alter table public.interview_questions enable row level security;
alter table public.module_skills enable row level security;

-- Same access pattern as `modules` itself: gated on active enrollment in
-- the parent course, admin bypass.
create policy "module_playbook_sections_select_enrolled_or_admin" on public.module_playbook_sections
  for select using (
    public.is_admin() or exists (
      select 1 from public.modules m
      join public.enrollments e on e.course_id = m.course_id and e.status = 'active'
      where m.id = module_id and e.user_id = public.current_user_id()
    )
  );
create policy "module_playbook_sections_write_admin" on public.module_playbook_sections
  for all using (public.is_admin()) with check (public.is_admin());

create policy "exercises_select_enrolled_or_admin" on public.exercises
  for select using (
    public.is_admin() or exists (
      select 1 from public.modules m
      join public.enrollments e on e.course_id = m.course_id and e.status = 'active'
      where m.id = module_id and e.user_id = public.current_user_id()
    )
  );
create policy "exercises_write_admin" on public.exercises
  for all using (public.is_admin()) with check (public.is_admin());

create policy "interview_questions_select_enrolled_or_admin" on public.interview_questions
  for select using (
    public.is_admin() or exists (
      select 1 from public.modules m
      join public.enrollments e on e.course_id = m.course_id and e.status = 'active'
      where m.id = module_id and e.user_id = public.current_user_id()
    )
  );
create policy "interview_questions_write_admin" on public.interview_questions
  for all using (public.is_admin()) with check (public.is_admin());

-- module_skills is intentionally public-read (same as the skills taxonomy
-- itself) — "what does this module teach" is catalog information, useful
-- even to a visitor deciding whether to enroll, not gated content.
create policy "module_skills_select_public" on public.module_skills
  for select using (true);
create policy "module_skills_write_admin" on public.module_skills
  for all using (public.is_admin()) with check (public.is_admin());
