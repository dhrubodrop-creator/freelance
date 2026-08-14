-- Post-audit P1 fix: Proposal Generator (brief section 40) was entirely
-- missing — the monetisation journey dead-ended at a checklist. This
-- generates a client-facing proposal grounded ONLY in verified/approved
-- data the learner already has (approved portfolio case study, verified
-- skills, real project facts) plus explicit user-supplied inputs (service
-- type, buyer type, pricing) — never invented clients/revenue/metrics.
create table public.proposals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  portfolio_item_id uuid references public.portfolio_items (id) on delete set null,
  opportunity_id uuid references public.opportunities (id) on delete set null,
  service_type text not null,
  buyer_type text not null,
  inputs jsonb not null default '{}',
  problem_statement text not null,
  proposed_solution text not null,
  scope text not null,
  deliverables text[] not null default '{}',
  timeline text not null,
  assumptions text[] not null default '{}',
  exclusions text[] not null default '{}',
  pricing_structure text,
  next_step_cta text not null,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);
create index proposals_user_id_idx on public.proposals (user_id, created_at desc);

alter table public.proposals enable row level security;

create policy "proposals_select_own_or_admin" on public.proposals
  for select using (user_id = public.current_user_id() or public.is_admin());
create policy "proposals_insert_own" on public.proposals
  for insert with check (user_id = public.current_user_id());
create policy "proposals_update_own" on public.proposals
  for update using (user_id = public.current_user_id());
create policy "proposals_delete_own" on public.proposals
  for delete using (user_id = public.current_user_id());
