-- Phase 13: Smart Celebrations dedup log. Skill Tree, Momentum Meter, and
-- Weekly Build Story need no new tables — all three are computed on read
-- from existing evidence (skills/mastery, project_verification_runs,
-- project_checkpoints, progress). This table exists only so a real
-- milestone (first deployment, first passing eval, etc.) is celebrated
-- exactly once, not re-shown every page load.
create table public.celebrated_milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  milestone_key text not null,
  created_at timestamptz not null default now(),
  unique (user_id, milestone_key)
);

alter table public.celebrated_milestones enable row level security;

create policy "celebrated_milestones_select_own_or_admin" on public.celebrated_milestones
  for select using (user_id = public.current_user_id() or public.is_admin());
create policy "celebrated_milestones_insert_own" on public.celebrated_milestones
  for insert with check (user_id = public.current_user_id());
