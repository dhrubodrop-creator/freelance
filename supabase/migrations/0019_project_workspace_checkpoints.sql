-- Phase 4: Build From My Idea + Project Checkpoints.
--
-- `project_idea_plans` covers section 10 ("Build From My Idea"): the learner
-- enters idea/target user/problem/outcome, the AI router drafts a PRD/user
-- stories/architecture/data model/milestones/workspace template content
-- (README + env var template + branch strategy — real, usable text content,
-- not a fake "repository created" claim, since no GitHub OAuth App is
-- configured yet — see github_connections in the next migration), and the
-- learner must explicitly approve before it's treated as real project
-- requirements. `portfolio_item_id` starts null (the idea precedes a
-- project) and is set once the learner turns an approved plan into a real
-- portfolio item, same "approve, then it's real" gate as
-- portfolio_case_studies.
create table public.project_idea_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  course_id uuid references public.courses (id) on delete set null,
  portfolio_item_id uuid references public.portfolio_items (id) on delete set null,
  idea text not null,
  target_user text not null,
  problem text not null,
  desired_outcome text not null,
  optional_features text[] not null default '{}',
  prd text not null,
  user_stories jsonb not null default '[]',
  acceptance_criteria text[] not null default '{}',
  architecture_proposal text not null,
  data_model text not null,
  milestones jsonb not null default '[]',
  course_mapping text,
  suggested_repo_name text not null,
  readme_content text not null,
  env_template text not null,
  branch_strategy text not null,
  approved boolean not null default false,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);
create index project_idea_plans_user_id_idx on public.project_idea_plans (user_id, created_at desc);

-- Project checkpoints: a learner-triggered (or task-completion-triggered)
-- snapshot of where a project stands. Hangs off portfolio_items (the
-- existing "project" record), same join-through-parent RLS pattern as
-- project_decisions. `state_snapshot` captures the honest, checkable state
-- at that moment (module reached, decisions logged, exercises done) so
-- "compare" is a real diff, not vibes.
create table public.project_checkpoints (
  id uuid primary key default gen_random_uuid(),
  portfolio_item_id uuid not null references public.portfolio_items (id) on delete cascade,
  label text not null,
  task text,
  learner_note text,
  commit_sha text,
  state_snapshot jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index project_checkpoints_portfolio_item_id_idx on public.project_checkpoints (portfolio_item_id, created_at desc);

alter table public.project_idea_plans enable row level security;
alter table public.project_checkpoints enable row level security;

create policy "project_idea_plans_select_own_or_admin" on public.project_idea_plans
  for select using (user_id = public.current_user_id() or public.is_admin());
create policy "project_idea_plans_insert_own" on public.project_idea_plans
  for insert with check (user_id = public.current_user_id());
create policy "project_idea_plans_update_own" on public.project_idea_plans
  for update using (user_id = public.current_user_id());

create policy "project_checkpoints_select_own_or_admin" on public.project_checkpoints
  for select using (
    exists (select 1 from public.portfolio_items p where p.id = portfolio_item_id and (p.user_id = public.current_user_id() or public.is_admin()))
  );
create policy "project_checkpoints_insert_own" on public.project_checkpoints
  for insert with check (
    exists (select 1 from public.portfolio_items p where p.id = portfolio_item_id and p.user_id = public.current_user_id())
  );
create policy "project_checkpoints_delete_own" on public.project_checkpoints
  for delete using (
    exists (select 1 from public.portfolio_items p where p.id = portfolio_item_id and p.user_id = public.current_user_id())
  );
