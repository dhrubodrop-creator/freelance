-- Phase 2 of the skill-to-income platform evolution: a normalized skills
-- taxonomy plus proof-of-skill (portfolio). Users select from a curated,
-- admin-managed skill list rather than free-typing arbitrary skill names —
-- this is the deliberate mechanism that keeps the taxonomy from becoming
-- thousands of near-duplicate entries.
--
-- The seeded skills below aren't invented — they're distilled from the real
-- module topics already in `modules.topics` across the 19 live courses
-- (verified by querying the table directly before writing this), renamed
-- from lesson-topic sentences into clean, nameable competencies, plus one
-- "Business & Client Skills" category drawn from the playbook/monetisation
-- content that already exists per track (client discovery, pricing,
-- proposals).

create table public.skill_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.skill_categories (id) on delete restrict,
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);
create index skills_category_id_idx on public.skills (category_id);

create table public.user_skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete cascade,
  -- Self-assessed only at this stage — course-derived and assessment-based
  -- confidence signals are a later phase, and the product must never
  -- conflate the two as if the system already knows someone's true level.
  self_level text not null check (self_level in ('beginner', 'intermediate', 'advanced', 'expert')),
  created_at timestamptz not null default now(),
  unique (user_id, skill_id)
);
create index user_skills_user_id_idx on public.user_skills (user_id);

create table public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  course_id uuid references public.courses (id) on delete set null,
  title text not null,
  description text,
  problem text,
  solution text,
  tools_used text[] not null default '{}',
  outcome text,
  links text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index portfolio_items_user_id_idx on public.portfolio_items (user_id);

-- Many-to-many join, not a text[] array, so "skills demonstrated by this
-- project" stays referentially tied to the real skills taxonomy rather than
-- free text that could drift out of sync with it.
create table public.portfolio_item_skills (
  portfolio_item_id uuid not null references public.portfolio_items (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete cascade,
  primary key (portfolio_item_id, skill_id)
);

alter table public.skill_categories enable row level security;
alter table public.skills enable row level security;
alter table public.user_skills enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.portfolio_item_skills enable row level security;

-- Taxonomy tables: public read (same pattern as courses), admin-only write.
create policy "skill_categories_select_public" on public.skill_categories
  for select using (true);
create policy "skill_categories_write_admin" on public.skill_categories
  for all using (public.is_admin()) with check (public.is_admin());

create policy "skills_select_public" on public.skills
  for select using (true);
create policy "skills_write_admin" on public.skills
  for all using (public.is_admin()) with check (public.is_admin());

-- Owner-or-admin, same pattern as work_experiences/education.
create policy "user_skills_select_own_or_admin" on public.user_skills
  for select using (user_id = public.current_user_id() or public.is_admin());
create policy "user_skills_insert_own_or_admin" on public.user_skills
  for insert with check (user_id = public.current_user_id() or public.is_admin());
create policy "user_skills_update_own_or_admin" on public.user_skills
  for update using (user_id = public.current_user_id() or public.is_admin());
create policy "user_skills_delete_own_or_admin" on public.user_skills
  for delete using (user_id = public.current_user_id() or public.is_admin());

create policy "portfolio_items_select_own_or_admin" on public.portfolio_items
  for select using (user_id = public.current_user_id() or public.is_admin());
create policy "portfolio_items_insert_own_or_admin" on public.portfolio_items
  for insert with check (user_id = public.current_user_id() or public.is_admin());
create policy "portfolio_items_update_own_or_admin" on public.portfolio_items
  for update using (user_id = public.current_user_id() or public.is_admin());
create policy "portfolio_items_delete_own_or_admin" on public.portfolio_items
  for delete using (user_id = public.current_user_id() or public.is_admin());

-- portfolio_item_skills has no user_id of its own — ownership is via the
-- parent portfolio_items row.
create policy "portfolio_item_skills_select_own_or_admin" on public.portfolio_item_skills
  for select using (
    exists (select 1 from public.portfolio_items p where p.id = portfolio_item_id and (p.user_id = public.current_user_id() or public.is_admin()))
  );
create policy "portfolio_item_skills_insert_own_or_admin" on public.portfolio_item_skills
  for insert with check (
    exists (select 1 from public.portfolio_items p where p.id = portfolio_item_id and (p.user_id = public.current_user_id() or public.is_admin()))
  );
create policy "portfolio_item_skills_delete_own_or_admin" on public.portfolio_item_skills
  for delete using (
    exists (select 1 from public.portfolio_items p where p.id = portfolio_item_id and (p.user_id = public.current_user_id() or public.is_admin()))
  );

-- Seed: 10 categories (9 existing course tracks + business/client skills),
-- distilled from real module topics, not invented.
insert into public.skill_categories (name, description) values
  ('Agentic Systems', 'Building autonomous, tool-using AI agents.'),
  ('AI Engineering', 'Building and deploying production LLM applications.'),
  ('AI Operations', 'Running AI/ML systems reliably in production.'),
  ('AI Security', 'Defending and testing AI applications.'),
  ('AI Strategy', 'Product and strategy work on AI-powered features.'),
  ('Cloud AI', 'Building on Azure, AWS, and GCP AI platforms.'),
  ('Data & ML', 'Classical data science and machine learning.'),
  ('Dev Tooling', 'AI-assisted software development.'),
  ('No-Code Automation', 'Building AI-powered workflows without code.'),
  ('Business & Client Skills', 'Turning technical skill into paid client work.');

insert into public.skills (category_id, name, description)
select c.id, s.name, s.description from public.skill_categories c
join (values
  ('Agentic Systems', 'LangGraph', 'Graph-based orchestration for stateful, multi-step agents.'),
  ('Agentic Systems', 'LangChain / LCEL', 'Chains, tool-calling, and the LangChain Expression Language.'),
  ('Agentic Systems', 'RAG Pipeline Design', 'Chunking, embeddings, retrieval, and reranking for grounded answers.'),
  ('Agentic Systems', 'Agent Architecture Design', 'Designing goals, memory, tools, and constraints before writing code.'),
  ('Agentic Systems', 'Multi-Agent Orchestration', 'Supervisor/worker patterns and escalation between agents.'),
  ('Agentic Systems', 'Tool-Calling & Function Schemas', 'Wiring agents to real APIs and structured tool definitions.'),
  ('Agentic Systems', 'Agent Monitoring & Debugging', 'Tracing agent decisions and debugging failure paths in production.'),
  ('AI Engineering', 'Prompt Engineering', 'Few-shot design, structured outputs, and prompting patterns.'),
  ('AI Engineering', 'Fine-Tuning (LoRA / QLoRA)', 'Adapting base models to specialized tasks efficiently.'),
  ('AI Engineering', 'LLM API Integration', 'Working across provider APIs with cost/latency tradeoffs.'),
  ('AI Engineering', 'AI Service Deployment', 'Containerizing and shipping AI services with CI/CD.'),
  ('AI Engineering', 'Model Observability', 'Monitoring, tracing, and cost/latency analytics for AI systems.'),
  ('AI Engineering', 'Forward-Deployed Engineering', 'Embedding with clients to translate and ship AI solutions.'),
  ('AI Operations', 'AIOps & Anomaly Detection', 'ML-driven alert correlation and noise reduction.'),
  ('AI Operations', 'MLOps Pipeline Design', 'Data pipelines, retraining triggers, and model packaging.'),
  ('AI Operations', 'LLMOps & Prompt Versioning', 'Prompt registries, golden datasets, and regression testing.'),
  ('AI Operations', 'AI Incident Response', 'Postmortems and rollback safety nets for agent-assisted changes.'),
  ('AI Security', 'Prompt Injection Defense', 'Identifying and mitigating the #1 risk in LLM applications.'),
  ('AI Security', 'AI Red-Teaming', 'Adversarial testing of agents and RAG systems.'),
  ('AI Security', 'LLM Evaluation & Testing', 'Golden datasets, LLM-as-judge, and automated regression testing.'),
  ('AI Security', 'AI Threat Modeling', 'OWASP Top 10 for LLMs and enterprise security review.'),
  ('AI Strategy', 'AI Product Requirements (PRDs)', 'Writing PRDs for non-deterministic, probabilistic features.'),
  ('AI Strategy', 'AI Feature Evaluation Design', 'Defining success criteria and evals for AI features.'),
  ('AI Strategy', 'AI Roadmapping', 'Planning AI features against model and infrastructure constraints.'),
  ('Cloud AI', 'Azure AI Services', 'Microsoft Foundry, Azure OpenAI, and Azure AI app development.'),
  ('Cloud AI', 'AWS Bedrock & SageMaker', 'Managed foundation models and custom ML on AWS.'),
  ('Cloud AI', 'Google Vertex AI', 'Model Garden, Gemini tuning, and Vertex AI Pipelines.'),
  ('Data & ML', 'Exploratory Data Analysis', 'Data cleaning and building a defensible data narrative.'),
  ('Data & ML', 'Feature Engineering', 'Preparing data and selecting models for a business problem.'),
  ('Data & ML', 'Model Evaluation', 'Metrics, error analysis, and iteration cycles.'),
  ('Data & ML', 'LLM-Augmented Analytics', 'Combining classical ML with generative AI for real users.'),
  ('Dev Tooling', 'AI Pair Programming (Claude Code)', 'Working inside an AI-native development environment.'),
  ('Dev Tooling', 'AI-Assisted Code Review', 'Reviewing AI-generated diffs safely at scale.'),
  ('Dev Tooling', 'Codebase Context Engineering', 'Giving an AI agent enough project context to work autonomously.'),
  ('No-Code Automation', 'n8n Workflow Design', 'Triggers, conditional routing, and API integration without code.'),
  ('No-Code Automation', 'No-Code Agent Orchestration', 'Manager/worker agent patterns built in a visual tool.'),
  ('No-Code Automation', 'Structured Prompting for Agents', 'JSON-mindset outputs and context layering for automations.'),
  ('Business & Client Skills', 'Client Discovery', 'Finding and qualifying a first paying client.'),
  ('Business & Client Skills', 'Service Pricing & Packaging', 'Turning a skill into a priced, scoped offer.'),
  ('Business & Client Skills', 'Proposal Writing', 'Framing a project so a client says yes.'),
  ('Business & Client Skills', 'Freelance Positioning', 'Presenting yourself credibly as a specialist, not a generalist.')
) as s(category_name, name, description) on c.name = s.category_name;
