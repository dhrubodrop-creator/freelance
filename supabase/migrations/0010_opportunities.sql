-- Phase 5 of the skill-to-income platform evolution: opportunity
-- architecture only, deliberately not a marketplace. No rows are seeded
-- here — there is no real opportunity data source yet (no partner feed, no
-- external API integration), and the spec this was built against is
-- explicit: "Never invent opportunities." The /opportunities page shows a
-- correct, honest empty state until an admin curates real listings or a
-- real feed is wired in later.

create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null check (type in ('job', 'freelance', 'consulting', 'training', 'partnership', 'business_lead')),
  description text,
  category_id uuid references public.skill_categories (id) on delete set null,
  source text not null default 'curated' check (source in ('curated', 'partner_feed', 'external_api')),
  source_url text,
  location text,
  is_remote boolean not null default false,
  compensation_range text,
  posted_at date not null default current_date,
  created_at timestamptz not null default now()
);
create index opportunities_category_id_idx on public.opportunities (category_id);

-- Required/relevant skills per opportunity, same many-to-many pattern as
-- portfolio_item_skills — keeps matching tied to the real skills taxonomy.
create table public.opportunity_skills (
  opportunity_id uuid not null references public.opportunities (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete cascade,
  primary key (opportunity_id, skill_id)
);

-- A user's computed match against an opportunity — match_score is computed
-- by plain deterministic code (skill overlap), not an LLM. Recomputed and
-- upserted when either side changes; not a live-updating materialized view,
-- to keep this phase simple.
create table public.opportunity_matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  opportunity_id uuid not null references public.opportunities (id) on delete cascade,
  match_score integer not null check (match_score between 0 and 100),
  computed_at timestamptz not null default now(),
  unique (user_id, opportunity_id)
);
create index opportunity_matches_user_id_idx on public.opportunity_matches (user_id);

alter table public.opportunities enable row level security;
alter table public.opportunity_skills enable row level security;
alter table public.opportunity_matches enable row level security;

create policy "opportunities_select_public" on public.opportunities
  for select using (true);
create policy "opportunities_write_admin" on public.opportunities
  for all using (public.is_admin()) with check (public.is_admin());

create policy "opportunity_skills_select_public" on public.opportunity_skills
  for select using (true);
create policy "opportunity_skills_write_admin" on public.opportunity_skills
  for all using (public.is_admin()) with check (public.is_admin());

create policy "opportunity_matches_select_own_or_admin" on public.opportunity_matches
  for select using (user_id = public.current_user_id() or public.is_admin());
create policy "opportunity_matches_insert_own_or_admin" on public.opportunity_matches
  for insert with check (user_id = public.current_user_id() or public.is_admin());
create policy "opportunity_matches_update_own_or_admin" on public.opportunity_matches
  for update using (user_id = public.current_user_id() or public.is_admin());
create policy "opportunity_matches_delete_own_or_admin" on public.opportunity_matches
  for delete using (user_id = public.current_user_id() or public.is_admin());
