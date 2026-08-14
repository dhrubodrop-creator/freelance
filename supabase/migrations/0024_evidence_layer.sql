-- Phase 12: Evidence Timeline, Before/After Playback, Architecture Diagram
-- Generator, Shareable Proof Link.
--
-- Evidence Timeline and Before/After Playback need NO new tables — they're
-- computed by merging existing evidence sources (project_checkpoints,
-- project_decisions, project_verification_runs, github_events) chronologically
-- (src/lib/evidence-timeline.ts). Case study / portfolio generation (section
-- 34/35) and the Verified Skill Passport (section 37) already existed before
-- this phase via portfolio_case_studies and src/lib/mastery.ts + /proof —
-- not duplicated here.
--
-- Architecture Diagram Generator only needs somewhere to store the
-- generated diagram (Mermaid syntax, rendered client-side — no new heavy
-- diagramming service).
alter table public.portfolio_items add column architecture_diagram_mermaid text;
alter table public.portfolio_items add column architecture_diagram_generated_at timestamptz;

-- Shareable Proof Link: a random opaque token, not the user's own id, so
-- the public URL can't be guessed from a Clerk/Supabase id and can be
-- revoked/rotated independently of the account.
create table public.proof_share_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  token text not null unique,
  created_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.proof_share_tokens enable row level security;

create policy "proof_share_tokens_select_own_or_admin" on public.proof_share_tokens
  for select using (user_id = public.current_user_id() or public.is_admin());
create policy "proof_share_tokens_insert_own" on public.proof_share_tokens
  for insert with check (user_id = public.current_user_id());
create policy "proof_share_tokens_delete_own" on public.proof_share_tokens
  for delete using (user_id = public.current_user_id());
