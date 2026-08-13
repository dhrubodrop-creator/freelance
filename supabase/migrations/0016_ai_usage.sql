-- AI usage observability. Every call through the new provider router
-- (src/lib/ai/router.ts) writes one row here — provider, model, task,
-- tokens, latency, success/failure, retry count, whether a cache hit or a
-- dedup'd in-flight request served the response. This is what section 35's
-- "AI cost / quota observability" reads from (admin UI ships in a later
-- phase); the table exists now because it needs to start collecting data
-- from the moment the router exists, same reasoning as `analytics_events`
-- shipping before any dashboard read it.
--
-- Internal/admin-only — no student-facing surface reads this table, and it
-- never stores prompt/response content, only shape (tokens, timing,
-- outcome), so it carries no new privacy exposure.

create table public.ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete set null,
  provider text not null,
  model text not null,
  task text not null,
  input_tokens integer,
  output_tokens integer,
  latency_ms integer not null,
  success boolean not null,
  error_message text,
  retry_count integer not null default 0,
  cache_hit boolean not null default false,
  deduped boolean not null default false,
  created_at timestamptz not null default now()
);
create index ai_usage_logs_created_at_idx on public.ai_usage_logs (created_at desc);
create index ai_usage_logs_task_idx on public.ai_usage_logs (task);

alter table public.ai_usage_logs enable row level security;

create policy "ai_usage_logs_select_admin" on public.ai_usage_logs
  for select using (public.is_admin());
