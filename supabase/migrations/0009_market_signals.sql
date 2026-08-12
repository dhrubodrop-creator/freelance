-- Phase 4 of the skill-to-income platform evolution: Market Pulse. Deliberately
-- NOT a generic news feed — signals are tagged to a skill category so a
-- user's Market Pulse page can filter to what's actually relevant to their
-- skills. No live crawler/ingestion pipeline yet (per the spec's own
-- "don't build an expensive crawler ecosystem immediately" instruction) —
-- this table is the clean, admin-manageable abstraction that a future
-- automated ingestion job can write into without any app-code changes.
--
-- Every seeded row here is a fact already verified with a real, named
-- source during the earlier Industry Snapshot research pass in this
-- project (src/lib/industry-data.ts) — nothing new is being asserted here,
-- this just re-structures already-cited facts for per-skill-category
-- filtering instead of per-course display.

create table public.market_signals (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.skill_categories (id) on delete cascade,
  signal text not null,
  direction text not null check (direction in ('rising', 'declining', 'stable')),
  source text not null,
  source_url text,
  confidence text not null default 'verified' check (confidence in ('verified', 'estimated')),
  region text not null default 'Global',
  observed_at date not null,
  created_at timestamptz not null default now()
);
create index market_signals_category_id_idx on public.market_signals (category_id);

alter table public.market_signals enable row level security;

create policy "market_signals_select_public" on public.market_signals
  for select using (true);
create policy "market_signals_write_admin" on public.market_signals
  for all using (public.is_admin()) with check (public.is_admin());

insert into public.market_signals (category_id, signal, direction, source, source_url, region, observed_at)
select c.id, s.signal, s.direction, s.source, s.source_url, s.region, s.observed_at::date
from public.skill_categories c
join (values
  ('Agentic Systems', 'Searches for AI-agent implementation expertise on Fiverr surged 18,347% over six months.', 'rising', 'Fiverr Spring 2025 Business Trends Index', 'https://www.fiverr.com/news/spring-bti-2025', 'Global', '2025-05-13'),
  ('Agentic Systems', 'AI agents'' success rate on real-world computer tasks rose from about 12% to 66% in roughly 18 months.', 'rising', 'Stanford HAI data, reported by Forbes', 'https://www.forbes.com/sites/stevenwolfepereira/2026/04/14/stanfords-ai-report-card-agents-are-ready-companies-are-not/', 'Global', '2026-04-14'),
  ('AI Engineering', 'LinkedIn''s 2025 "Jobs on the Rise" report ranked AI Engineer the #1 fastest-growing job title in the US.', 'rising', 'LinkedIn 2025 Jobs on the Rise report', null, 'United States', '2025-01-07'),
  ('AI Engineering', 'Enterprise GenAI spend grew from roughly $1.7 billion in 2023 to $37 billion in 2025.', 'rising', 'Menlo Ventures, "2025 State of Generative AI in the Enterprise"', 'https://menlovc.com/perspective/2025-the-state-of-generative-ai-in-the-enterprise/', 'Global', '2025-12-01'),
  ('AI Operations', 'The LLMOps software market is projected to grow from $5.88B (2025) to $7.14B (2026), reaching $15.59B by 2030.', 'rising', 'Research and Markets', null, 'Global', '2025-01-01'),
  ('AI Security', '41% of security professionals cite AI as a critical skill gap on their team — the top-cited gap for the second year running.', 'rising', '(ISC)2 2025 Cybersecurity Workforce Study', null, 'Global', '2025-12-01'),
  ('AI Strategy', 'Netflix posted a fully-remote Generative AI Product Manager role with a published salary range of $240,000-$700,000 a year.', 'rising', 'Fortune', 'https://fortune.com/2025/10/02/netflix-gen-ai-product-manager-240k-700k-salary-fully-remote', 'United States', '2025-10-02'),
  ('Cloud AI', 'AWS announced at re:Invent 2025 that Bedrock has more than 100,000 customers, with over 50 of them each processing more than 1 trillion tokens.', 'rising', 'AWS official re:Invent 2025 recap', 'https://www.aboutamazon.com/news/aws/aws-re-invent-2025-ai-news-updates', 'Global', '2025-12-01'),
  ('Data & ML', 'Data Scientist median annual wage was $112,590 (May 2024), with 34% projected employment growth from 2024 to 2034.', 'rising', 'US Bureau of Labor Statistics, Occupational Outlook Handbook', null, 'United States', '2024-05-01'),
  ('Dev Tooling', 'Claude Code reached $1 billion in run-rate revenue in November 2025 — six months after general availability.', 'rising', 'Anthropic official announcement', 'https://www.anthropic.com/news/anthropic-acquires-bun-as-claude-code-reaches-usd1b-milestone', 'Global', '2025-11-01'),
  ('No-Code Automation', 'n8n raised a $180M Series C in October 2025 at a $2.5B valuation, reaching $40M ARR with 230,000+ active users.', 'rising', 'TechFundingNews / Sacra', 'https://techfundingnews.com/n8n-raises-180m-series-c-2-5-billion-valuation-automation-ai/', 'Global', '2025-10-01'),
  ('Business & Client Skills', 'Demand for AI-tied freelance skills on Upwork grew 109% year-over-year in 2025.', 'rising', 'Upwork 2026 In-Demand Skills report', null, 'Global', '2025-12-01')
) as s(category_name, signal, direction, source, source_url, region, observed_at) on c.name = s.category_name;
