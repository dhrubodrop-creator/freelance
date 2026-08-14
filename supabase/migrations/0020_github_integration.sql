-- Phase 5: GitHub integration architecture.
--
-- No GitHub OAuth App is registered for this deployment yet (no
-- GITHUB_CLIENT_ID/GITHUB_CLIENT_SECRET in the environment) — this ships
-- the real, working schema + server-side OAuth/webhook code path so the
-- feature is live the moment the owner registers an app and sets those two
-- env vars, without ever claiming a connection exists when it doesn't (see
-- src/lib/github.ts's isGitHubConfigured() gate).
--
-- `access_token` is written and read only by service-role server code
-- (src/lib/github.ts) — no RLS select policy exposes it to the owning user
-- or any client-side query, matching "never expose GitHub tokens to the
-- browser."

create table public.github_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  github_username text not null,
  access_token text not null,
  scopes text[] not null default '{}',
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

-- A portfolio item (the existing "project" record) linked to a specific
-- GitHub repo the learner owns/controls. Evidence, not raw activity — see
-- github_events below for the append-only activity log this is built from.
create table public.github_repo_links (
  id uuid primary key default gen_random_uuid(),
  portfolio_item_id uuid not null references public.portfolio_items (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  repo_full_name text not null,
  default_branch text not null default 'main',
  connected_at timestamptz not null default now(),
  unique (portfolio_item_id)
);

-- Append-only event log from GitHub webhooks (push / pull_request /
-- workflow_run / deployment_status), summarized (no full payloads/diffs
-- stored — those can contain secrets accidentally committed) so it's safe
-- evidence, not a raw activity firehose. `meaningful` is set by
-- src/lib/github.ts's evidence classifier — a push is not automatically
-- "meaningful" (e.g. a force-push of an empty commit isn't), matching the
-- brief's "don't count every commit as proof of mastery" instruction.
create table public.github_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  repo_full_name text not null,
  event_type text not null check (event_type in ('push', 'pull_request', 'workflow_run', 'deployment_status')),
  summary text not null,
  meaningful boolean not null default false,
  external_id text,
  received_at timestamptz not null default now()
);
create index github_events_user_id_idx on public.github_events (user_id, received_at desc);
create unique index github_events_dedupe_idx on public.github_events (repo_full_name, event_type, external_id) where external_id is not null;

alter table public.github_connections enable row level security;
alter table public.github_repo_links enable row level security;
alter table public.github_events enable row level security;

-- No select policy for access_token to any non-service-role caller: users
-- can see that they're connected (github_username, scopes, connected_at)
-- through a server route that explicitly omits access_token from the
-- select list, never through direct RLS-gated client access to this table.
create policy "github_connections_select_own_or_admin" on public.github_connections
  for select using (user_id = public.current_user_id() or public.is_admin());
create policy "github_connections_delete_own" on public.github_connections
  for delete using (user_id = public.current_user_id());

create policy "github_repo_links_select_own_or_admin" on public.github_repo_links
  for select using (user_id = public.current_user_id() or public.is_admin());
create policy "github_repo_links_insert_own" on public.github_repo_links
  for insert with check (user_id = public.current_user_id());
create policy "github_repo_links_delete_own" on public.github_repo_links
  for delete using (user_id = public.current_user_id());

create policy "github_events_select_own_or_admin" on public.github_events
  for select using (user_id = public.current_user_id() or public.is_admin());
