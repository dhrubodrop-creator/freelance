-- Phase 6 of the skill-to-income platform evolution: the operational
-- infrastructure needed for admin visibility and in-app notifications.
-- Three tables, each intentionally minimal for this pass:
--
-- analytics_events — event logging so future analytics/funnel work is built
-- from real recorded events (per the spec: "First implement reliable event
-- tracking... then build analytics from actual data" — not before).
--
-- admin_audit_logs — who did what to what, for admin mutations. Never logs
-- passwords/payment secrets, only the identifiers and a small metadata blob.
--
-- notifications — in-app notifications, separate from the existing Resend
-- email triggers (which stay as-is); this is what a bell icon reads from.

create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete set null,
  event_name text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index analytics_events_user_id_idx on public.analytics_events (user_id);
create index analytics_events_event_name_idx on public.analytics_events (event_name);
create index analytics_events_created_at_idx on public.analytics_events (created_at);

create table public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.users (id) on delete set null,
  action text not null,
  target_type text not null,
  target_id text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index admin_audit_logs_created_at_idx on public.admin_audit_logs (created_at);
create index admin_audit_logs_actor_user_id_idx on public.admin_audit_logs (actor_user_id);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_id_idx on public.notifications (user_id);

alter table public.analytics_events enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.notifications enable row level security;

-- Both analytics_events and admin_audit_logs are written exclusively by
-- server-side code using the service-role key (which bypasses RLS anyway) —
-- RLS here exists purely as the same defense-in-depth read layer used
-- everywhere else in this schema, not as the primary access control.
create policy "analytics_events_select_admin" on public.analytics_events
  for select using (public.is_admin());
create policy "analytics_events_insert_own_or_admin" on public.analytics_events
  for insert with check (user_id = public.current_user_id() or public.is_admin() or user_id is null);

create policy "admin_audit_logs_select_admin" on public.admin_audit_logs
  for select using (public.is_admin());
create policy "admin_audit_logs_insert_admin" on public.admin_audit_logs
  for insert with check (public.is_admin());

create policy "notifications_select_own_or_admin" on public.notifications
  for select using (user_id = public.current_user_id() or public.is_admin());
create policy "notifications_insert_own_or_admin" on public.notifications
  for insert with check (user_id = public.current_user_id() or public.is_admin());
create policy "notifications_update_own_or_admin" on public.notifications
  for update using (user_id = public.current_user_id() or public.is_admin());
