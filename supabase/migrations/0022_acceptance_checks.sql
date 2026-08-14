-- Phase 8: Executable Definition of Done.
--
-- Machine-verifiable acceptance criteria per project. Only http_200 /
-- http_auth_rejects / deployment_live are actually auto-checked (a safe
-- outbound fetch to a URL the learner supplies — never execution of learner
-- code on the Ropes server). `manual` criteria are explicitly
-- self-attested, labeled as such in the UI, never presented as verified.
create table public.acceptance_checks (
  id uuid primary key default gen_random_uuid(),
  portfolio_item_id uuid not null references public.portfolio_items (id) on delete cascade,
  description text not null,
  check_type text not null default 'manual' check (
    check_type in ('manual', 'http_200', 'http_auth_rejects', 'deployment_live')
  ),
  target_url text,
  last_result text check (last_result in ('pass', 'fail')),
  last_checked_at timestamptz,
  self_attested boolean not null default false,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);
create index acceptance_checks_portfolio_item_id_idx on public.acceptance_checks (portfolio_item_id, order_index);

alter table public.acceptance_checks enable row level security;

create policy "acceptance_checks_select_own_or_admin" on public.acceptance_checks
  for select using (
    exists (select 1 from public.portfolio_items p where p.id = portfolio_item_id and (p.user_id = public.current_user_id() or public.is_admin()))
  );
create policy "acceptance_checks_insert_own" on public.acceptance_checks
  for insert with check (
    exists (select 1 from public.portfolio_items p where p.id = portfolio_item_id and p.user_id = public.current_user_id())
  );
create policy "acceptance_checks_update_own" on public.acceptance_checks
  for update using (
    exists (select 1 from public.portfolio_items p where p.id = portfolio_item_id and p.user_id = public.current_user_id())
  );
create policy "acceptance_checks_delete_own" on public.acceptance_checks
  for delete using (
    exists (select 1 from public.portfolio_items p where p.id = portfolio_item_id and p.user_id = public.current_user_id())
  );
